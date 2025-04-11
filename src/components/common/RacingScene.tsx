import { ReactNode, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewcube, SoftShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useControls, folder } from 'leva'
import { DirectionalLight, SpotLight } from 'three'

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
  defaultShadowDistance = 3,
  defaultShadowOpacity = 0.8,
  defaultShadowSize = 12,
  defaultLightPosition = [0, 2, 8],
  defaultBackgroundColor = 'transparent'
}: IRacingSceneProps) {
  const shadowPlaneRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<DirectionalLight>(null!)
  
  // Create properly structured controls
  const { 
    // shadowDistance is used in the original code but we're using fixed positioning now
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    showLightHelper: { value: true }
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

      // Debug shadow settings
      console.log('RacingScene Shadow Debug:');
      console.log('- Light position:', [lightX, lightY, lightZ]);
      console.log('- Shadow settings:', {
        castShadow: currentLight.castShadow,
        mapSize: currentLight.shadow?.mapSize,
        bias: currentLight.shadow?.bias,
        camera: {
          near: currentLight.shadow?.camera.near,
          far: currentLight.shadow?.camera.far,
          top: currentLight.shadow?.camera.top,
          right: currentLight.shadow?.camera.right,
          bottom: currentLight.shadow?.camera.bottom,
          left: currentLight.shadow?.camera.left
        }
      });
      console.log('- Shadow plane:', {
        position: shadowPlaneRef.current?.position,
        rotation: shadowPlaneRef.current?.rotation,
        receiveShadow: shadowPlaneRef.current?.receiveShadow
      });
      
      return () => {
        helper.dispose()
        if (parent) {
          parent.remove(helper)
        }
      }
    }
    return undefined
  }, [showLightHelper, lightX, lightY, lightZ])
  
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
          
          {/* We're using a custom ground plane in the component itself now */}
          
          {/* Scene lights and shadow planes are now defined in the components */}
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