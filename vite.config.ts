import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  server: {
    port: 5173, // Default Vite port
    proxy: {
      // Proxy all requests starting with /api/logs to the debug server
      '/api/logs': {
        target: 'http://localhost:3030',
        changeOrigin: true,
        // Remove the /api/logs prefix when forwarding
        rewrite: (path) => path.replace(/^\/api\/logs/, '')
      }
    }
  }
})
