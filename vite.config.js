import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        // Gom toàn bộ file giao diện, script, style để chạy offline
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "Vys Finance",
        short_name: "VysFinance",
        description: "Personal Finance Tracker",
        theme_color: "#000000",
        background_color: "#f2f2f7",
        display: "standalone",
        icons: [
          {
            src: "https://cdn-icons-png.flaticon.com/512/5501/5501375.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "https://cdn-icons-png.flaticon.com/512/5501/5501375.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
