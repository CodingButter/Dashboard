import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

// Check for panel mode environment variables
const isPanelMode = process.env.PANEL_MODE || 'default';

// Get the appropriate entry point based on the panel mode
const getEntryPoint = () => {
  switch (isPanelMode) {
    case 'unified':
      return 'src/unified-main.tsx';
    case 'combined':
      return 'src/combined-main.tsx';
    case 'leva':
      return 'src/leva-main.tsx';
    default:
      return 'src/main.tsx';
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, getEntryPoint()),
      },
    },
  },
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
