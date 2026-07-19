import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("react-router")) return "vendor-react";
          if (id.includes("lightweight-charts") || id.includes("d3-format")) return "vendor-charts";
          if (id.includes("lucide-react") || id.includes("@radix-ui")) return "vendor-ui";
          return "vendor";
        },
      },
    },
  },
})
