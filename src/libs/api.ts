export enum AXIS {
  BRAKE = "1_15r0",
  THROTTLE = "1_13r0",
  CLUTCH = "1_14r0",
  STEERING = "1_2",
}
export interface IAXIS_DATA {
  BRAKE: { CurrentAngle: number }
  THROTTLE: { CurrentAngle: number }
  CLUTCH: { CurrentAngle: number }
  STEERING: { Rotation: number }
}

export type LISTENER = (data: any) => void

export default class Client {
  private listeners: { [key: string]: LISTENER[] } = {}
  private data: { [key: string]: any } = {}
  private server: WebSocketURL 
  constructor(connection: WebSocketURL ) {
    this.server = connection
    this.createSocket()
  }

  private createSocket(): void {
    const socket = new WebSocket(this.server)
    socket.onopen = () => {
      // Socket connection established
      socket.send("echo|")
    }
    socket.onmessage = (event: MessageEvent) => {
      const message = event.data
      if (message == "-1|echo") {
        socket.send("pid|-1")
        socket.send("mainTemplateLoading|")
        socket.send(
          "registerComponents|/Dashtemplates/RSC - Input Display - Analog/RSC - Input Display - Analog.djson"
        )
        socket.send("mainTemplateLoaded|")
      } else {
        const response = message.split("|")
        const data = response[1]
        socket.send(`pid|${response[0]}`)
        this.data = JSON.parse(data)
        this.trigger()
      }
    }
  }
  public addListener<T extends keyof IAXIS_DATA>(
    axi: T,
    callback: (data: IAXIS_DATA[T]) => void
  ): [T, (data: any) => void] {
    const listeners = this.listeners?.[axi]
    if (!listeners) this.listeners[axi] = []
    this.listeners[axi].push(callback)
    return [axi, callback]
  }
  private trigger(): void {
    Object.keys(this.listeners).forEach((axi: string) => {
      const listeners = this.listeners[axi]
      if (listeners && this.data?.d?.C?.[AXIS[axi]]) {
        listeners.forEach((listener) => {
          listener(this.data.d?.C?.[AXIS[axi]])
        })
      }
    })
  }
}
