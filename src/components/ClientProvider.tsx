import { useEffect, useState } from "react"
import { ClientContext } from "../context/ClientContext"
import Client, { type WebSocketString } from "../libs/api"
const server: WebSocketString = "ws://192.168.1.151:8888/ws"

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null)
  const [brake, setBrake] = useState<number>(0)
  const [throttle, setThrottle] = useState<number>(0)
  const [clutch, setClutch] = useState<number>(0)
  const [steering, setSteering] = useState<number>(0)

  useEffect(() => {
    const client = new Client(server)
    client.addListener<"BRAKE">("BRAKE", (data: { CurrentAngle: number }) => {
      setBrake(data.CurrentAngle)
    })
    client.addListener<"THROTTLE">("THROTTLE", (data: { CurrentAngle: number }) => {
      setThrottle(data.CurrentAngle)
    })
    client.addListener<"CLUTCH">("CLUTCH", (data: { CurrentAngle: number }) => {
      setClutch(data.CurrentAngle)
    })
    client.addListener<"STEERING">("STEERING", (data: { Rotation: number }) => {
      setSteering(data.Rotation)
    })

    setClient(client)
    return () => {
      setClient(null)
    }
  }, [])

  return (
    <ClientContext.Provider value={{ client, brake, clutch, throttle, steering }}>
      {children}
    </ClientContext.Provider>
  )
}
