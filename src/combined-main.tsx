import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import CombinedApp from "./CombinedApp.tsx"
import WSClientProvider from "@providers/WSClientProvider"
import { GlobalStateProvider } from "./hooks/useGlobalState"
import { initLogger } from "@utils/logger"

// Initialize console logger to capture errors
initLogger();

const udpServer = import.meta.env.VITE_WS_SERVER

// Custom config path for global state, defaulting to a path in public/config
const globalConfigPath = import.meta.env.VITE_GLOBAL_CONFIG_PATH || '/config/global-state.json'

// Conditionally use StrictMode only in development
const isDevelopment = import.meta.env.DEV;

createRoot(document.getElementById("root")!).render(
  isDevelopment ? (
    // Keep StrictMode in development for better debugging
    <StrictMode>
      <GlobalStateProvider configPath={globalConfigPath}>
        <WSClientProvider serverPath={udpServer}>
          <CombinedApp />
        </WSClientProvider>
      </GlobalStateProvider>
    </StrictMode>
  ) : (
    // In production, skip StrictMode to avoid double renders and improve performance
    <GlobalStateProvider configPath={globalConfigPath}>
      <WSClientProvider serverPath={udpServer}>
        <CombinedApp />
      </WSClientProvider>
    </GlobalStateProvider>
  )
)