import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  // Served from /ire/app/ by Caddy (and by Vercel's directory-index rewrite); the
  // assets must be referenced with that prefix or they 404 under the subpath.
  base: "/ire/app/",
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
