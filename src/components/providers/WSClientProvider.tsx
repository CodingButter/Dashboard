import  { PropsWithChildren, useEffect, useState } from "react"
import { WSClientContext } from "@/hooks/useWSClient"
import Client from "@/libs/api"
export interface IUDPClientContextProps extends PropsWithChildren {
  serverPath: WebSocketURL 
}

export default function WSClientProvider({ serverPath,children}: IUDPClientContextProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [brake, setBrake] = useState<number>(0)
  const [throttle, setThrottle] = useState<number>(0)
  const [clutch, setClutch] = useState<number>(0)
  const [steering, setSteering] = useState<number>(0)

  useEffect(() => {
    const client = new Client(serverPath)
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
    <WSClientContext.Provider value={{ client, brake, clutch, throttle, steering }}>
      {children}
    </WSClientContext.Provider>
  )
}
