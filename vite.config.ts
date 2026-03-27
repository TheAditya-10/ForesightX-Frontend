import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api/auth": {
          target: env.VITE_AUTH_URL || "http://localhost:8004",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/auth/, ""),
        },
        "/api/orchestration": {
          target: env.VITE_ORCHESTRATION_URL || "http://localhost:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/orchestration/, ""),
        },
        "/api/data": {
          target: env.VITE_DATA_URL || "http://localhost:8001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/data/, ""),
        },
        "/api/profile": {
          target: env.VITE_PROFILE_URL || "http://localhost:8002",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/profile/, ""),
        },
        "/api/pattern": {
          target: env.VITE_PATTERN_URL || "http://localhost:8003",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pattern/, ""),
        },
      },
    },
  };
});
