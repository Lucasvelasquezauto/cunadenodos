import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv();

export default defineConfig({
  testDir: "./e2e",
  // Serial: varios workers en paralelo saturan el pool de conexiones de
  // Supabase (plan gratuito) y producen timeouts falsos, no fallas reales.
  workers: 1,
  timeout: 45_000,
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
});
