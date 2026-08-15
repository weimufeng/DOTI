export interface TongjiDistrict {
  name: string;
  pvCount: number;
  ratio: number;
}

export interface TongjiStats {
  pvCount: number;
  visitorCount?: number;
  districts: TongjiDistrict[];
  rangeLabel?: string;
  updatedAt?: string;
}

export async function loadTongjiStats(): Promise<TongjiStats | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}tongji-stats.json`, {
      cache: "no-cache",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TongjiStats;
    if (!data || typeof data.pvCount !== "number") return null;
    if (!Array.isArray(data.districts)) data.districts = [];
    return data;
  } catch {
    return null;
  }
}
