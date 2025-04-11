import { useRef } from "react"
import { useWSClient } from "@hooks/useWSClient"
import { useControls } from "leva"
import { PerspectiveCamera } from "@react-three/drei"
import { RacingScene, RacingComponent, ModelLoader } from "./common"
import * as THREE from "three"

// Toggle for development mode controls
const useDevControls = import.meta.env.VITE_CONTROL === "true"

export default function Throttle() {
  const pedalRef = useRef<THREE.Group>(null!)
  const { throttle } = useWSClient()
  
  // Development controls for testing without websocket data
  const throttleControl = useControls("throttle", {
    throttleControl: {
      value: 0,
      min: 0,
      max: 100,
      step: 1,
      disabled: !useDevControls
    }
  }).throttleControl
  
  // Enhanced visual controls
  const { 
    elevation, 
    distance, 
    angle, 
    brightness, 
    ambience
  } = useControls("throttleVisuals", {
    elevation: { value: -2, min: -5, max: 5, step: 0.1 },     // Pedal sits a bit lower
    distance: { value: 2.5, min: 0, max: 10, step: 0.1 },     // Distance to shadow
    angle: { value: 30, min: 0, max: 90, step: 1 },           // Starting angle of the pedal
    brightness: { value: 1.8, min: 0, max: 5, step: 0.1 },    // Lighting brightness
    ambience: { value: 0.3, min: 0, max: 1, step: 0.05 }      // Ambient light intensity
  })
  
  // Use either the dev control value or the real websocket value
  const rotationValue = (useDevControls ? throttleControl : throttle) + angle
  
  return (
    <RacingScene 
      showControls={true}
      showGizmo={false}
      controlsGroup="throttlePedal"
      defaultShadowDistance={distance}
      defaultShadowOpacity={0.6}
      defaultShadowSize={12}
      defaultLightPosition={[0, 10, 5]}
      defaultBackgroundColor="transparent"
    >
      {/* Camera setup */}
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
      
      {/* Throttle pedal component - positioned to the right of brake */}
      <RacingComponent
        ref={pedalRef}
        rotation={rotationValue}
        rotationAxis={[1, 0, 0]}
        position={[3, elevation, 0]}
      >
        <ModelLoader 
          modelPath="/models/NRGWheel.gltf" // Replace with actual pedal model when available
          scale={0.01}
          castShadow={true}
          receiveShadow={false}
        />
      </RacingComponent>
      
      {/* Enhanced lighting */}
      <ambientLight intensity={ambience} />
      <spotLight 
        position={[8, 8, 5]} 
        intensity={brightness * 0.5} 
        angle={0.4} 
        penumbra={0.7} 
        castShadow={false} 
      />
    </RacingScene>
  )
}
