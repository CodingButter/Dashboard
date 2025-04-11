import { useRef } from "react"
import { useWSClient } from "@hooks/useWSClient"
import { useControls } from "leva"
import { PerspectiveCamera } from "@react-three/drei"
import { RacingScene, RacingComponent, ModelLoader } from "./common"
import * as THREE from "three"

// Toggle for development mode controls
const useDevControls = import.meta.env.VITE_CONTROL === "true"

export default function SteeringWheel() {
  const wheelRef = useRef<THREE.Group>(null!)
  const { steering } = useWSClient()
  
  // Development controls for testing without websocket data
  const steeringControl = useControls("wheel", {
    steeringControl: {
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      disabled: !useDevControls
    }
  }).steeringControl
  
  // Enhanced visual controls
  const { 
    elevation, 
    distance, 
    brightness, 
    ambience 
  } = useControls("wheelVisuals", {
    elevation: { value: 0, min: -5, max: 5, step: 0.1 },      // Slight elevation to improve shadow appearance
    distance: { value: 1.5, min: 0, max: 10, step: 0.1 },     // Distance to shadow
    brightness: { value: 1.5, min: 0, max: 5, step: 0.1 },    // Lighting brightness
    ambience: { value: 0.3, min: 0, max: 1, step: 0.05 }      // Ambient light intensity
  })
  
  // Use either the dev control value or the real websocket value
  const rotationValue = useDevControls ? steeringControl : steering
  
  return (
    <RacingScene 
      showControls={true}
      showGizmo={true}
      controlsGroup="steeringWheel"
      defaultShadowDistance={distance}
      defaultShadowOpacity={0.7}
      defaultShadowSize={12}
      defaultLightPosition={[0, 10, 5]}
      defaultBackgroundColor="transparent"
    >
      {/* Camera setup */}
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
      
      {/* Steering wheel component */}
      <RacingComponent
        ref={wheelRef}
        rotation={rotationValue}
        rotationAxis={[0, 0, 1]}
        position={[0, elevation, 0]}
      >
        <RacingComponent rotation={180} rotationAxis={[0, 1, 0]}>
          <ModelLoader 
            modelPath="/models/NRGWheel.gltf"
            scale={0.01}
            castShadow={true}
            receiveShadow={false}
          />
        </RacingComponent>
      </RacingComponent>
      
      {/* Enhanced lighting */}
      <ambientLight intensity={ambience} />
      <spotLight 
        position={[5, 5, 5]} 
        intensity={brightness * 0.5} 
        angle={0.3} 
        penumbra={0.8} 
        castShadow={false} 
      />
    </RacingScene>
  )
}
