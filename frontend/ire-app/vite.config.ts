import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  // Served from /ire/ by Caddy and Vercel (both rewrite /ire and /ire/ to this build's
  // index.html); the assets must be referenced with that prefix or they 404.
  base: "/ire/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
