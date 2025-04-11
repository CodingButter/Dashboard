import { useRef } from "react"
import { useWSClient } from "@hooks/useWSClient"
import { useControls } from "leva"
import { PerspectiveCamera } from "@react-three/drei"
import { RacingScene, RacingComponent, ModelLoader } from "./common"
import * as THREE from "three"
import { DirectionalLight, SpotLight } from "three"

// Toggle for development mode controls
const useDevControls = import.meta.env.VITE_CONTROL === "true"

export default function SteeringWheel() {
  const wheelRef = useRef<THREE.Group>(null!)
  const { steering } = useWSClient()
  
  // Development controls for testing without websocket data
  const steeringControl = useControls("Steering Input", {
    steeringControl: {
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      disabled: !useDevControls
    }
  }).steeringControl
  
  // Wheel model controls
  const { 
    rotationX,
    scaleXYZ
  } = useControls("Wheel Settings", {
    rotationX: { value: 0, min: 0, max: 360, step: 1 },          // Rotation around X axis
    scaleXYZ: { value: 0.01, min: 0.001, max: 0.1, step: 0.001 }, // Model scale
  })
  
  // Ground plane controls
  const {
    groundHeight,
    groundVisible,
    shadowOpacity
  } = useControls("Shadow Surface", {
    groundHeight: { value: -2, min: -10, max: -0.5, step: 0.1 }, // Height of ground plane
    groundVisible: { value: false },                              // Whether ground is visible or just shows shadow
    shadowOpacity: { value: 0.6, min: 0, max: 1, step: 0.05 }     // Opacity of shadows
  })
  
  // Lighting controls
  const {
    brightness, 
    ambience,
    mainLightX,
    mainLightY,
    mainLightZ,
    fillLightIntensity
  } = useControls("Lighting", {
    ambience: { value: 0.2, min: 0, max: 1, step: 0.05 },       // Ambient light intensity
    brightness: { value: 2.5, min: 0, max: 5, step: 0.1 },      // Main light brightness
    fillLightIntensity: { value: 0.8, min: 0, max: 2, step: 0.1 }, // Fill light intensity
    mainLightX: { value: 5, min: -10, max: 10, step: 0.5 },     // Main light X position
    mainLightY: { value: 8, min: 0, max: 15, step: 0.5 },       // Main light Y position
    mainLightZ: { value: 5, min: -10, max: 10, step: 0.5 }      // Main light Z position
  })
  
  // Use either the dev control value or the real websocket value
  const rotationValue = useDevControls ? steeringControl : steering
  
  return (
    <RacingScene 
      showControls={true}
      showGizmo={true}
      controlsGroup="steeringWheel"
      defaultShadowDistance={3}
      defaultShadowOpacity={0.7}
      defaultShadowSize={12}
      defaultLightPosition={[2, 6, 8]}
      defaultBackgroundColor="transparent"
    >
      {/* Camera setup - top-down view */}
      <PerspectiveCamera makeDefault position={[0, 10, 0]} rotation={[-Math.PI/2, 0, 0]} fov={45} />
      
      {/* Steering wheel component - reoriented to face up */}
      <RacingComponent
        ref={wheelRef}
        rotation={rotationValue}
        rotationAxis={[0, 1, 0]} 
        position={[0, 0, 0]}
      >
        <RacingComponent rotation={rotationX} rotationAxis={[1, 0, 0]}>
          <ModelLoader 
            modelPath="/models/NRGWheel.gltf"
            scale={scaleXYZ}
            castShadow={true}
            receiveShadow={true}
          />
        </RacingComponent>
      </RacingComponent>
      
      {/* Ground plane to catch shadows */}
      <mesh 
        position={[0, groundHeight, 0]} 
        rotation={[-Math.PI/2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        {groundVisible ? (
          <meshStandardMaterial 
            color="#555555"
            roughness={0.8}
            metalness={0.2}
          />
        ) : (
          <shadowMaterial
            transparent
            opacity={shadowOpacity}
            color="#000000"
          />
        )}
      </mesh>
      
      {/* Enhanced lighting for top-down view */}
      <ambientLight intensity={ambience} />
      
      {/* Main directional light for strong shadows - position controlled by UI */}
      <directionalLight 
        position={[mainLightX, mainLightY, mainLightZ]} 
        intensity={brightness * 2} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.001}
        color="#ffffff"
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-top={15}
        shadow-camera-right={15}
        shadow-camera-bottom={-15}
        shadow-camera-left={-15}
      />
      
      {/* Secondary light for detail - opposite to main light */}
      <directionalLight 
        position={[-mainLightX * 0.7, mainLightY * 0.8, -mainLightZ * 0.5]} 
        intensity={fillLightIntensity} 
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        color="#fffaf0"
      />
      
      {/* Fill light to brighten shadows - always from above */}
      <spotLight 
        position={[0, mainLightY + 2, 0]} 
        intensity={brightness * 0.3} 
        angle={0.8} 
        penumbra={0.5} 
        castShadow={false}
        color="#ffffff"
      />
    </RacingScene>
  )
}
