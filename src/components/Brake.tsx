import { useClient } from "../context/ClientContext"

export default function Brake() {
  const { brake } = useClient()!
  return (
    <div className="flex justify-center items-center font-bold text-8xl">
      <div className="brake">{brake}</div>
    </div>
  )
}
