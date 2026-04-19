import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api/auth": {
          target: env.VITE_AUTH_URL || "http://localhost:8004",
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/api\/auth/, ""),
        },
        "/api/orchestration": {
          target: env.VITE_ORCHESTRATION_URL || "http://localhost:8000",
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/api\/orchestration/, ""),
        },
        "/api/data": {
          target: env.VITE_DATA_URL || "http://localhost:8001",
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/api\/data/, ""),
        },
        "/api/profile": {
          target: env.VITE_PROFILE_URL || "http://localhost:8002",
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/api\/profile/, ""),
        },
        "/api/pattern": {
          target: env.VITE_PATTERN_URL || "http://localhost:8003",
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/api\/pattern/, ""),
        },
      },
    },
    plugins: [react()],
    optimizeDeps: {
      include: ["recharts", "next-themes", "framer-motion"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});
