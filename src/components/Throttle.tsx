import THREE from "three"
import { useClient } from "../hooks/useWSClient"
import { Canvas } from "@react-three/fiber"
import { degreesToRadians } from "../utils/math"
import { OrbitControls, useGLTF } from "@react-three/drei"

interface IWheelProps {
  rotation: number
}

export function Pedal({ rotation, ...props }: IWheelProps) {
  const { nodes, materials } = useGLTF("/models/steeringwheel.glb")
  return (
    <group {...props} dispose={null}>
      <OrbitControls />
      <mesh
        geometry={(nodes.model as THREE.Mesh).geometry}
        material={materials.CustomMaterial}
        rotation={[0, degreesToRadians(180), degreesToRadians(rotation)]}
        scale={[2, 2, 2]}
      />
    </group>
  )

  useGLTF.preload("/steeringwheel.glb")
}

export default function Throttle() {
  const { throttle } = useClient()
  return (
    <div className="flex justify-center items-center font-bold text-8xl">
      <Canvas className="w-full h-full">
        <directionalLight
          castShadow
          intensity={1}
          position={[0, 10, -10]}
          rotation={[0, 0, 0]}
          color="#ffffff"
        />
        <Pedal rotation={throttle} />
      </Canvas>
    </div>
  )
}
