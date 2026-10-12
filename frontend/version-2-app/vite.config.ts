import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  // Served from /version-2/ by Caddy and Vercel (both rewrite /version-2 and
  // /version-2/ to this build's index.html); the assets must be referenced with that
  // prefix or they 404.
  base: "/version-2/",
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
