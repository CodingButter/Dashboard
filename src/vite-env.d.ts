/// <reference types="vite/client" />

declare global {
  type WebSocketURL = `${"ws" | "wss"}://${string}${`:${string}` | ""}${`/${string}` | ""}`;
}

// This extends the Vite ImportMetaEnv interface
declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_WS_SERVER: WebSocketURL;
    readonly VITE_CONTROL: string;
  }
}

// This export is needed to make the file a module
export {};