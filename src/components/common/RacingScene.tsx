import { ReactNode, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewcube, SoftShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useControls, folder } from 'leva'

interface IRacingSceneProps {
  children: ReactNode;
  showControls?: boolean;
  showGizmo?: boolean;
  controlsGroup?: string;
  defaultShadowDistance?: number;
  defaultShadowOpacity?: number;
  defaultShadowSize?: number;
  defaultLightPosition?: [number, number, number];
  defaultBackgroundColor?: string;
}

export default function RacingScene({
  children,
  showControls = true,
  showGizmo = false,
  controlsGroup = 'scene',
  defaultShadowDistance = 2,
  defaultShadowOpacity = 0.5,
  defaultShadowSize = 10,
  defaultLightPosition = [0, 10, 10],
  defaultBackgroundColor = 'transparent'
}: IRacingSceneProps) {
  const shadowPlaneRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<THREE.SpotLight>(null!)
  
  // Create properly structured controls
  const { 
    shadowDistance, 
    shadowOpacity, 
    shadowSize, 
    shadowBlur, 
    shadowColor,
    lightX,
    lightY,
    lightZ,
    showLightHelper 
  } = useControls(controlsGroup, {
    'Shadow Settings': folder({
      shadowDistance: { value: defaultShadowDistance, min: 0, max: 10, step: 0.1 },
      shadowOpacity: { value: defaultShadowOpacity, min: 0, max: 1, step: 0.05 },
      shadowSize: { value: defaultShadowSize, min: 5, max: 20, step: 0.5 },
      shadowBlur: { value: 0.2, min: 0, max: 2, step: 0.05 },
      shadowColor: { value: '#000000' }
    }),
    'Light Settings': folder({
      lightX: { value: defaultLightPosition[0], min: -20, max: 20, step: 0.5 },
      lightY: { value: defaultLightPosition[1], min: 0, max: 20, step: 0.5 },
      lightZ: { value: defaultLightPosition[2], min: -20, max: 20, step: 0.5 }
    }),
    showLightHelper: { value: false }
  })
  
  // Handle light helper via useEffect to avoid conditional rendering issues
  useEffect(() => {
    if (showLightHelper && lightRef.current) {
      // Safe access to parent
      const parent = lightRef.current.parent
      if (!parent) return undefined
      
      const currentLight = lightRef.current
      const helper = new THREE.SpotLightHelper(currentLight, 'red')
      parent.add(helper)
      
      return () => {
        helper.dispose()
        if (parent) {
          parent.remove(helper)
        }
      }
    }
    return undefined
  }, [showLightHelper])
  
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Canvas 
        className="w-full h-full" 
        shadows={{ 
          type: THREE.PCFSoftShadowMap,
          enabled: true
        }}
        gl={{ 
          antialias: true,
          alpha: true  // Enable transparency in the renderer
        }}
      >
        {/* Enable high-quality soft shadows */}
        <SoftShadows size={25} samples={16} focus={0.5} />
        
        {/* Set background color (use null for transparent) */}
        {defaultBackgroundColor !== 'transparent' ? (
          <color attach="background" args={[defaultBackgroundColor]} />
        ) : null}
        
        <group>
          {showControls && <OrbitControls />}
          
          {/* The children components will be nested here */}
          {children}
          
          {/* Enhanced shadow-catching plane - only shows shadows */}
          <mesh 
            ref={shadowPlaneRef}
            position={[0, 0, -shadowDistance]} 
            rotation={[0, 0, 0]} 
            receiveShadow
          >
            <planeGeometry args={[shadowSize, shadowSize]} />
            <meshBasicMaterial 
              color={shadowColor}
              transparent 
              opacity={0} // Make the plane itself invisible
              alphaTest={0.01}
            />
            <shadowMaterial 
              transparent 
              opacity={shadowOpacity} 
              color={shadowColor}
              blending={THREE.MultiplyBlending} // Better shadow blending
            />
          </mesh>
          
          {/* Base lighting */}
          <ambientLight intensity={0.5} />
          
          {/* Enhanced spotlight with better shadow settings */}
          <spotLight
            ref={lightRef}
            castShadow
            position={[lightX, lightY, lightZ]}
            intensity={1.5}
            angle={0.6}
            penumbra={0.5}
            color="#ffffff"
            shadow-mapSize={[4096, 4096]} // Higher resolution shadow maps
            shadow-bias={-0.0005}         // Adjusted bias to reduce artifacts
            shadow-radius={shadowBlur * 15} // Apply blur to shadows
            shadow-camera-near={0.1}      // Adjusted for better shadow precision
            shadow-camera-far={100}
          />
        </group>
        
        {showGizmo && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewcube />
          </GizmoHelper>
        )}
      </Canvas>
    </div>
  )
}