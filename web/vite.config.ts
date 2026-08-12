import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: https://weimufeng.github.io/DOTI/
const GH_PAGES_BASE = "/DOTI/";

export default defineConfig(({ command }) => ({
  // Local `npm run dev` stays at `/`; production build uses the Pages subpath.
  base: command === "serve" ? "/" : GH_PAGES_BASE,
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
}));
