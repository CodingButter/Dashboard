import { useClient } from "../context/ClientContext"
import { Canvas } from "@react-three/fiber"
import { degreesToRadians } from "../utils/math"
import { OrbitControls } from "@react-three/drei"
import OBJModel from "./OBJModel"

interface IWheelProps {
  rotation: number
}

export function Wheel({ rotation, ...props }: IWheelProps) {
  return (
    <group
      {...props}
      dispose={null}
      rotation={[0, degreesToRadians(180), degreesToRadians(rotation)]}
      scale={[2, 2, 2]}>
      <OrbitControls />
      <OBJModel objPath="/models/NRGWheel v1.obj" mtlPath="/models/NRGWheel v1.mtl" />
    </group>
  )
}

export default function SteeringWheel() {
  const { steering } = useClient()
  return (
    <div className="w-full h-full">
      <Canvas className="w-full h-full">
        <directionalLight
          castShadow
          intensity={1}
          position={[0, 10, -10]}
          rotation={[0, 0, 0]}
          color="#ffffff"
        />
        <Wheel rotation={steering} />
      </Canvas>
    </div>
  )
}
