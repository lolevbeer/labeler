import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Proxy lolev.beer's API through the dev/preview server so the browser hits a
// same-origin path (the upstream API sends no CORS headers). For a static
// production deploy you'd replicate this with a host-level rewrite.
const lolevProxy = {
  "/lolev-api": {
    target: "https://lolev.beer",
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/lolev-api/, "/api"),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5174, strictPort: true, proxy: lolevProxy },
  preview: { port: 5174, strictPort: true, proxy: lolevProxy },
})
