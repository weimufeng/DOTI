/**
 * Pull page-view and geo reports from Baidu Tongji OpenAPI.
 * Writes public/tongji-stats.json for the landing page.
 *
 * Auth: https://tongji.baidu.com/api/manual/Chapter2/openapi.html
 * Reports: overview/getTimeTrendRpt, overview/getDistrictRpt
 *
 * Secrets stay in the environment — never VITE_* (those ship to the browser).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.resolve(__dirname, "../public/tongji-stats.json");

const API_KEY = env("BAIDU_TONGJI_API_KEY");
const SECRET_KEY = env("BAIDU_TONGJI_SECRET_KEY");
const REFRESH_TOKEN = env("BAIDU_TONGJI_REFRESH_TOKEN");
const ACCESS_TOKEN = env("BAIDU_TONGJI_ACCESS_TOKEN");
const SITE_ID = env("BAIDU_TONGJI_SITE_ID");

function env(name) {
  return (process.env[name] ?? "").trim();
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function toNum(value) {
  if (value == null || value === "" || value === "--") return 0;
  const n = Number(String(value).replace(/[%,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cellName(cell) {
  if (typeof cell === "string") return cell;
  if (Array.isArray(cell)) return cellName(cell[0]);
  if (cell && typeof cell === "object" && "name" in cell) return String(cell.name);
  return "";
}

async function getJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Tongji API returned non-JSON (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data.error_msg || data.error_description || `HTTP ${res.status}`);
  }
  if (data.error_code && Number(data.error_code) !== 0) {
    throw new Error(data.error_msg || `error_code ${data.error_code}`);
  }
  return data;
}

async function resolveAccessToken() {
  if (API_KEY && SECRET_KEY && REFRESH_TOKEN) {
    const url = new URL("https://openapi.baidu.com/oauth/2.0/token");
    url.searchParams.set("grant_type", "refresh_token");
    url.searchParams.set("refresh_token", REFRESH_TOKEN);
    url.searchParams.set("client_id", API_KEY);
    url.searchParams.set("client_secret", SECRET_KEY);
    const data = await getJson(url);
    const token = data.access_token;
    if (!token) throw new Error("refresh_token did not return access_token");
    return token;
  }
  return ACCESS_TOKEN;
}

function unwrapSites(json) {
  if (Array.isArray(json?.list)) return json.list;
  if (Array.isArray(json?.body?.data?.[0]?.list)) return json.body.data[0].list;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

function unwrapReport(json) {
  if (json?.result?.items) return json.result;
  if (json?.body?.data?.[0]?.result) return json.body.data[0].result;
  if (Array.isArray(json?.items)) return json;
  return null;
}

async function tongjiGet(accessToken, apiPath, params = {}) {
  const url = new URL(`https://openapi.baidu.com/rest/2.0/tongji/${apiPath}`);
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }
  return getJson(url);
}

async function resolveSite(accessToken) {
  const json = await tongjiGet(accessToken, "config/getSiteList");
  const sites = unwrapSites(json);
  const hit = SITE_ID
    ? sites.find((s) => String(s.site_id) === SITE_ID) || { site_id: SITE_ID }
    : sites.find((s) => String(s.domain ?? "").includes("weimufeng.github.io")) ||
      sites.find((s) => String(s.domain ?? "").includes("github.io")) ||
      sites[0];
  if (!hit?.site_id) throw new Error("getSiteList returned no site_id");
  const created = parseCreateDate(hit.create_time);
  return {
    siteId: String(hit.site_id),
    startDate: created,
  };
}

function parseCreateDate(raw) {
  const s = String(raw ?? "");
  const compact = s.match(/^(\d{8})/);
  if (compact) return compact[1];
  const dashed = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashed) return `${dashed[1]}${dashed[2]}${dashed[3]}`;
  return "20100101";
}

function yearChunks(startDate, endDate) {
  const chunks = [];
  const y0 = Number(startDate.slice(0, 4));
  const y1 = Number(endDate.slice(0, 4));
  for (let y = y0; y <= y1; y++) {
    const s = y === y0 ? startDate : `${y}0101`;
    const e = y === y1 ? endDate : `${y}1231`;
    chunks.push([s, e]);
  }
  return chunks;
}

function shortDistrictName(name) {
  const table = {
    北京市: "北京",
    天津市: "天津",
    上海市: "上海",
    重庆市: "重庆",
    广西壮族自治区: "广西",
    内蒙古自治区: "内蒙古",
    新疆维吾尔自治区: "新疆",
    宁夏回族自治区: "宁夏",
    西藏自治区: "西藏",
    香港特别行政区: "香港",
    澳门特别行政区: "澳门",
  };
  if (table[name]) return table[name];
  return name.replace(/省|市|自治区|特别行政区|维吾尔|回族|壮族/g, "") || name;
}

function mergeDistricts(parts) {
  const map = new Map();
  for (const d of parts) {
    const name = shortDistrictName(d.name);
    if (!name || name === "其他" || name === "国外" || name === "未知") continue;
    const prev = map.get(name) ?? { name, pvCount: 0, ratio: 0 };
    prev.pvCount += d.pvCount;
    map.set(name, prev);
  }
  const districts = [...map.values()];
  const pvSum = districts.reduce((s, d) => s + d.pvCount, 0);
  for (const d of districts) d.ratio = pvSum > 0 ? d.pvCount / pvSum : 0;
  districts.sort((a, b) => b.pvCount - a.pvCount || b.ratio - a.ratio);
  return districts;
}

function parseTrend(result) {
  const fields = result.fields ?? [];
  const items = result.items ?? [];
  const pvField = fields.indexOf("pv_count");
  const uvField = fields.indexOf("visitor_count");
  const rows = Array.isArray(items[1]) ? items[1] : [];
  const shift = fields[0] === "simple_date_title" ? 1 : 0;
  let pvCount = 0;
  let visitorCount = 0;
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    pvCount += toNum(row[pvField >= 0 ? pvField - shift : 0]);
    visitorCount += toNum(row[uvField >= 0 ? uvField - shift : 1]);
  }
  return { pvCount, visitorCount };
}

function parseDistricts(result) {
  const items = result.items ?? [];
  const names = Array.isArray(items[0]) ? items[0] : [];
  const values = Array.isArray(items[1]) ? items[1] : [];
  const fields = result.fields ?? [];
  const pvField = fields.indexOf("pv_count");
  const shift = fields[0]?.includes("district") || fields[0]?.includes("title") ? 1 : 0;

  const districts = [];
  for (let i = 0; i < names.length; i++) {
    const name = cellName(names[i]).trim();
    if (!name || name === "--") continue;
    const row = Array.isArray(values[i]) ? values[i] : [];
    const pvCount =
      pvField >= 0 ? toNum(row[pvField - shift]) : toNum(row[0]);
    let ratio = toNum(row[row.length - 1]);
    if (ratio > 1) ratio = ratio / 100;
    districts.push({ name, pvCount, ratio });
  }
  const pvSum = districts.reduce((s, d) => s + d.pvCount, 0);
  if (pvSum > 0) {
    for (const d of districts) d.ratio = d.pvCount / pvSum;
  }
  districts.sort((a, b) => b.ratio - a.ratio || b.pvCount - a.pvCount);
  return districts;
}

async function getReport(accessToken, siteId, startDate, endDate, method, metrics) {
  const json = await tongjiGet(accessToken, "report/getData", {
    site_id: siteId,
    method,
    start_date: startDate,
    end_date: endDate,
    metrics,
    max_results: 0,
  });
  const result = unwrapReport(json);
  if (!result) {
    throw new Error(`${method}: unexpected payload`);
  }
  return result;
}

async function main() {
  const token = await resolveAccessToken();
  if (!token) {
    console.log(
      "skip tongji stats: set BAIDU_TONGJI_ACCESS_TOKEN, or API Key + Secret + refresh_token",
    );
    process.exit(0);
  }

  const { siteId, startDate } = await resolveSite(token);
  const endDate = ymd(new Date());

  let pvCount = 0;
  let visitorCount = 0;
  const districtParts = [];
  for (const [from, to] of yearChunks(startDate, endDate)) {
    const trend = parseTrend(
      await getReport(
        token,
        siteId,
        from,
        to,
        "overview/getTimeTrendRpt",
        "pv_count,visitor_count,ip_count",
      ),
    );
    pvCount += trend.pvCount;
    visitorCount += trend.visitorCount;

    try {
      districtParts.push(
        ...parseDistricts(
          await getReport(
            token,
            siteId,
            from,
            to,
            "visit/district/a",
            "pv_count,visitor_count",
          ),
        ),
      );
    } catch (err) {
      console.warn("visit/district/a failed, fallback overview/getDistrictRpt:", err.message);
      districtParts.push(
        ...parseDistricts(
          await getReport(
            token,
            siteId,
            from,
            to,
            "overview/getDistrictRpt",
            "pv_count",
          ),
        ),
      );
    }
  }

  const districts = mergeDistricts(districtParts);

  const payload = {
    pvCount,
    visitorCount,
    districts,
    rangeLabel: "全站累计",
    updatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `wrote ${path.relative(process.cwd(), outFile)} pv=${payload.pvCount} districts=${districts.length}`,
  );
}

main().catch((err) => {
  console.error("fetch-tongji-stats failed:", err.message || err);
  process.exit(0);
});
