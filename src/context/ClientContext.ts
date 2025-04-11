import { createContext, useContext } from "react"
import Client from "../libs/api"
export interface IClientContext {
  client: Client | null
  brake: number
  throttle: number
  clutch?: number
  steering: number
}
export const ClientContext = createContext<IClientContext>({
  client: null,
  brake: 0,
  throttle: 0,
  clutch: 0,
  steering: 0,
})

export function useClient() {
  return useContext(ClientContext)
}
