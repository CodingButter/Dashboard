import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import WSClientProvider from "@providers/WSClientProvider"

const udpServer = import.meta.env.VITE_WS_SERVER

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WSClientProvider serverPath={udpServer}>
      <App />
    </WSClientProvider>
  </StrictMode>
)
