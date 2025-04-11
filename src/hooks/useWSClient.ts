import { createContext, useContext } from "react"
import Client from "../libs/api"
export interface IWSClientContext {
  client: Client | null
  brake: number
  throttle: number
  clutch?: number
  steering: number
}
export const WSClientContext = createContext<IWSClientContext>({
  client: null,
  brake: 0,
  throttle: 0,
  clutch: 0,
  steering: 0,
})

export function useWSClient() {
  return useContext(  WSClientContext)
}
