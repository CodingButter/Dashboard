import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import WSClientProvider from "@providers/WSClientProvider"
import { initLogger } from "@utils/logger"
import { Leva } from 'leva'

// Initialize console logger to capture errors
initLogger();

const udpServer = import.meta.env.VITE_WS_SERVER

// Custom Leva theme with wider panel
const levaTheme = {
  sizes: {
    rootWidth: '400px',
    controlWidth: '240px',
    labelWidth: '150px'
  },
  fonts: {
    base: '12px system-ui, sans-serif',
    mono: '12px monospace',
    title: 'bold 14px system-ui, sans-serif'
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Leva 
      theme={levaTheme}
      titleBar={{ 
        filter: false,
        drag: true 
      }} 
    />
    <WSClientProvider serverPath={udpServer}>
      <App />
    </WSClientProvider>
  </StrictMode>
)
