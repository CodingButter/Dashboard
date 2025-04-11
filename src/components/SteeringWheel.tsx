import { useWSClient } from "@hooks/useWSClient"
import { Canvas } from "@react-three/fiber"
import { degreesToRadians } from "../utils/math"
import { OrbitControls, GizmoHelper, GizmoViewcube, PerspectiveCamera } from "@react-three/drei"
import OBJModel from "./Model"
import { useControls } from "leva" 
import SpotLights from "./SpotLights"
import { useEffect,useRef,useState } from "react"
import * as THREE from "three"
const control = import.meta.env.VITE_CONTROL


interface IWheelProps {
  rotation: number
  scale?: [number, number, number] | number
}

export function Wheel({ rotation,scale, ...props }: IWheelProps) {
  return (
    <group
      castShadow
      receiveShadow
      {...props}
      dispose={null}
      rotation={[0, degreesToRadians(180), degreesToRadians(rotation)]}>
      <OBJModel scale={(typeof scale === "number" ? [scale, scale, scale] : scale)} modelPath="/models/NRGWheel.gltf"/>
    </group>
  )
}

function WheelScene(){
  const [cameraReady, setCameraReady] = useState<boolean>(false)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const wheelRef = useRef<THREE.Group>(null!)
  useEffect(()=>{
    if (cameraRef.current) {
      setCameraReady(true)
    }
  },[cameraRef])
  
  const { steeringControl } = useControls({
    steeringControl: {
      value: 0,
      min: -100,
      max: 100,
      step: 1,

    },
  })

  const { lightControl } = useControls({
    lightControl: {
      value: {
        x: 0,
        y: 10,
        z: 10,
      },
      min: -100,
      max: 100,
      step:.1
    }
  })

  const { x: light_x, y: light_y, z: light_z } = lightControl
  const { steering } = useWSClient()

  return (<group position={[0, 0, 0]} rotation={[0, 0, 0]} scale={1} castShadow receiveShadow>
    <>
     {cameraReady && <OrbitControls />}
    </>
        <Wheel ref={wheelRef} rotation={control?steeringControl:steering} scale={0.01}  />
        <mesh position={[0, 0, -2]} rotation={[0, 0, 0]} scale={1} castShadow receiveShadow>
          <meshStandardMaterial color="black" transparent opacity={0.2} />
          <boxGeometry args={[10, 10, 0]} />
        </mesh>
        <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 10]} fov={45} castShadow/> 
        <ambientLight intensity={0.5}/>
        <SpotLights target={wheelRef?.current} position={control?[light_x, light_y, light_z]:[0, 10, 10]} intensity={1.5} rotation={[0, degreesToRadians(180), 0]} color="#aaaaaa" castShadow />
  </group>)
}
export default function SteeringWheel() {
 
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Canvas className="w-full h-full" shadows>
      <WheelScene />
      <GizmoHelper alignment="bottom-right" margin={[80,80]} >
        <GizmoViewcube />
      </GizmoHelper>
      </Canvas>
    </div>
  )
}
