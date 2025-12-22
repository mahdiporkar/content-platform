import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "admin_mfe",
      filename: "remoteEntry.js",
      exposes: {
        "./AdminApp": "./src/AdminApp.tsx",
        "./routes": "./src/routes.tsx"
      },
      shared: ["react", "react-dom", "react-router-dom"]
    })
  ],
  build: {
    target: "esnext"
  },
  server: {
    port: 5173
  }
});
