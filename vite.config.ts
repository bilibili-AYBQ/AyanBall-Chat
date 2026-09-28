import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tauri 需要固定的 dev 端口与相对 base
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
    host: "0.0.0.0",
  },
  build: {
    target: "chrome110",
    outDir: "dist",
  },
});
