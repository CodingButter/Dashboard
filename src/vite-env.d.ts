/// <reference types="vite/client" />

declare global {
    type WebSocketURL = `${"ws" | "wss"}://${string}${`:${string}` | ""}${`/${string}` | ""}`;
  }
  
  interface ImportMetaEnv {
    readonly VITE_WS_SERVER: WebSocketURL;
    readonly VITE_CONTROL: boolean
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  // This export is needed to make the file a module
  export {};