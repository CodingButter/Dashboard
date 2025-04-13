import React, { ReactNode, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewcube, SoftShadows } from '@react-three/drei'
import * as THREE from 'three'
import { DirectionalLight } from 'three'

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
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // These parameters are kept for backward compatibility but not used
  controlsGroup,
  defaultShadowDistance,
  defaultShadowOpacity,
  defaultShadowSize,
  /* eslint-enable @typescript-eslint/no-unused-vars */
  defaultLightPosition = [0, 2, 8],
  defaultBackgroundColor = 'transparent'
}: IRacingSceneProps) {
  
  // Debug log to verify the component is rendering
  console.log("Rendering RacingScene component with:", { 
    showControls, 
    showGizmo, 
    childrenCount: React.Children.count(children) 
  });
  // Unused variables are intentional for API compatibility
  // We've moved to the centralized control panel system
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shadowPlaneRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<DirectionalLight>(null!)
  
  // This component no longer uses its own controls - we're using the combined panel instead
  // Define default values for the properties
  const lightX = defaultLightPosition[0];
  const lightY = defaultLightPosition[1];
  const lightZ = defaultLightPosition[2];
  const showLightHelper = true;
  
  // Handle light helper via useEffect to avoid conditional rendering issues
  // Only create helper in development mode to improve performance
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined; // Skip in production
    if (showLightHelper && lightRef.current) {
      // Safe access to parent
      const parent = lightRef.current.parent
      if (!parent) return undefined
      
      const currentLight = lightRef.current
      const helper = new THREE.DirectionalLightHelper(currentLight, 2, 'red')
      parent.add(helper)
      
      // Removed logging to reduce console output
      
      return () => {
        helper.dispose()
        if (parent) {
          parent.remove(helper)
        }
      }
    }
    return undefined
  }, [showLightHelper, lightX, lightY, lightZ])
  
  // Use a useEffect to set up canvas resizing
  useEffect(() => {
    // Function to update canvas size
    const updateCanvasSize = () => {
      // Force three.js to update its internal canvas size
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('resize'));
      }
    };
    
    // Call immediately and add resize listener
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Clean up
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);
  
  return (
    <div 
      className="flex justify-center items-center w-screen h-screen fixed top-0 left-0 pointer-events-auto z-[1]"
    >
      <Canvas 
        className="w-full h-full pointer-events-auto"
        shadows={{ 
          type: THREE.BasicShadowMap, // Use basic shadow map for better performance
          enabled: true
        }}
        gl={{ 
          antialias: true,
          alpha: true,  // Enable transparency in the renderer
          powerPreference: 'high-performance', // Request high performance mode
          failIfMajorPerformanceCaveat: false, // Don't fail if performance is poor
          precision: 'highp', // Use high precision if available, but allow fallback
          depth: true,
          stencil: false // Disable stencil buffer if not needed for better performance
        }}
        // Remove default camera to let components specify their own
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      >
        {/* Use lower quality soft shadows for better performance */}
        <SoftShadows size={40} samples={4} focus={0.5} /> {/* Further reduced shadow quality */}
        
        {/* Set background color (use null for transparent) */}
        {defaultBackgroundColor !== 'transparent' ? (
          <color attach="background" args={[defaultBackgroundColor]} />
        ) : null}
        
        <group>
          {showControls && (
            <OrbitControls 
              makeDefault 
              enableDamping={false}
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={50}
            />
          )}
          
          {/* The children components will be nested here */}
          {children}
          
          {/* We're using a custom ground plane in the component itself now */}
          
          {/* Scene lights and shadow planes are now defined in the components */}
        </group>
        
        {showGizmo && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]} renderPriority={2}>
            <GizmoViewcube />
          </GizmoHelper>
        )}
      </Canvas>
    </div>
  )
}