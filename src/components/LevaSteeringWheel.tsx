import React, { useEffect, useState, useCallback, useRef } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Environment, useHelper } from "@react-three/drei"
import { useControls, button, folder, Leva } from "leva"
import { useStorage } from "../hooks/useStorage"
import { useGlobalState } from "../hooks/useGlobalState"
import { exportLocalStorageAsJson } from "../utils/storageUtils"
import { resetPanelPositions } from "../utils/controlStateManager"
import * as THREE from "three"
import { ModelLoader } from "./common"

// Custom component to track camera position changes during orbit
interface CameraControlsProps {
  cameraPosition: [number, number, number];
  setCameraPosition: (position: [number, number, number]) => void;
  cameraFov: number;
  cameraZoom: number;
  orbitMinDistance: number;
  orbitMaxDistance: number;
  enableDamping: boolean;
}

// Component to handle directional light with helper
function MainDirectionalLight({ 
  position, 
  intensity, 
  shadowMapSize = 2048,
  shadowBias = -0.0001,
  shadowRadius = 1
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  // Only show helper in development mode
  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHelper(lightRef, THREE.DirectionalLightHelper, 2, "red");
  }
  
  return (
    <directionalLight 
      ref={lightRef}
      position={position} 
      intensity={intensity} 
      castShadow={true}
      shadow-mapSize={[shadowMapSize, shadowMapSize]}
      shadow-bias={shadowBias}
      shadow-radius={shadowRadius}
      shadow-camera-near={0.1}
      shadow-camera-far={100}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={15}
      shadow-camera-bottom={-15}
    />
  );
}

// This component syncs the camera controls with the stored state
function CameraControls({
  cameraPosition,
  setCameraPosition,
  cameraFov,
  cameraZoom,
  orbitMinDistance,
  orbitMaxDistance,
  enableDamping
}: CameraControlsProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const positionRef = useRef<[number, number, number]>(cameraPosition);
  const lastUpdateTime = useRef<number>(Date.now());
  const initializedRef = useRef<boolean>(false);
  
  // Force immediate camera initialization when component mounts - simplified
  useEffect(() => {
    if (!initializedRef.current && camera && cameraPosition) {
      // Set exact position using stored values - directly modify the position vector
      camera.position.x = cameraPosition[0];
      camera.position.y = cameraPosition[1];
      camera.position.z = cameraPosition[2];
      
      // Set FOV and zoom directly
      camera.fov = cameraFov;
      camera.zoom = cameraZoom;
      
      // Force camera update
      camera.updateProjectionMatrix();
      
      // Mark as initialized
      initializedRef.current = true;
    }
  }, [camera, cameraPosition, cameraFov, cameraZoom]);
  
  // Single combined effect for camera updates - to prevent too many effects running
  useEffect(() => {
    if (initializedRef.current && camera) {
      // Use requestAnimationFrame to avoid blocking the main thread
      requestAnimationFrame(() => {
        try {
          // Update position and settings
          camera.position.set(
            cameraPosition[0],
            cameraPosition[1],
            cameraPosition[2]
          );
          
          camera.fov = cameraFov;
          camera.zoom = cameraZoom;
          
          // Only update projection matrix once
          camera.updateProjectionMatrix();
        } catch (err) {
          console.error('Error updating camera', err);
        }
      });
    }
  }, [camera, cameraPosition, cameraFov, cameraZoom]);
  
  // First frame flag to ensure initial position is set
  const firstFrameRef = useRef(true);
  const throttleFrameCount = useRef(0);
  
  // Track camera position changes and update state with severe throttling to prevent freezing
  useFrame(() => {
    // Only run on first frame or every 30 frames to dramatically reduce processing
    if (firstFrameRef.current || throttleFrameCount.current >= 30) {
      throttleFrameCount.current = 0;
      
      // On the first frame after mount, force the camera to the exact stored position
      if (firstFrameRef.current && camera) {
        // Apply saved position directly with full precision
        camera.position.x = cameraPosition[0];
        camera.position.y = cameraPosition[1];
        camera.position.z = cameraPosition[2];
        camera.fov = cameraFov;
        camera.zoom = cameraZoom;
        camera.updateProjectionMatrix();
        
        // Force controls update if available
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Mark first frame as complete
        firstFrameRef.current = false;
      }
      
      // Track camera position changes once initialized - only run periodically
      if (!firstFrameRef.current && camera && controlsRef.current) {
        try {
          // Get current camera position with full precision - use try-catch to avoid errors
          const position: [number, number, number] = [
            camera.position.x,
            camera.position.y,
            camera.position.z
          ];
          
          // Check if position has changed significantly, using larger threshold for better performance
          const hasChanged = (
            Math.abs(position[0] - positionRef.current[0]) > 0.1 ||
            Math.abs(position[1] - positionRef.current[1]) > 0.1 ||
            Math.abs(position[2] - positionRef.current[2]) > 0.1
          );
          
          // Update state with much more aggressive throttling to prevent freezing
          if (hasChanged && Date.now() - lastUpdateTime.current > 1000) {
            // Update the position ref with exact values
            positionRef.current = position;
            // Call the state update function to save the exact position, wrapped in try/catch
            try {
              setCameraPosition(position);
            } catch (err) {
              console.error('Error updating camera position', err);
            }
            // Update the last update time
            lastUpdateTime.current = Date.now();
          }
        } catch (err) {
          // Safely catch any errors that might cause freezing
          console.error('Error in camera position tracking', err);
        }
      }
    } else {
      throttleFrameCount.current++;
    }
  });
  
  // Handle orbit controls reference - simplified to prevent freezing
  const handleOrbitControlsRef = useCallback((node: any) => {
    if (node) {
      // Just store the reference without extra processing
      controlsRef.current = node;
    }
  }, []);
  
  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={cameraPosition} 
        fov={cameraFov}
        zoom={cameraZoom}
      />
      <OrbitControls 
        ref={handleOrbitControlsRef}
        enableDamping={enableDamping} 
        dampingFactor={0.15} 
        rotateSpeed={0.5}
        minDistance={orbitMinDistance}
        maxDistance={orbitMaxDistance}
      />
    </>
  );
}

// Component wrapped in memo to reduce unnecessary re-renders
export default React.memo(function LevaSteeringWheel() {
  // Access the global state using our hook
  const { state: globalState, loadStateFromFile, resetState } = useGlobalState();
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Storage hooks for model position and properties
  const [rotationX, setRotationX] = useStorage<number>(
    "wheelRotationX", 
    globalState.wheelSettings?.rotationX || 90
  );
  
  const [rotationY, setRotationY] = useStorage<number>(
    "wheelRotationY", 
    globalState.wheelSettings?.rotationY || 0
  );
  
  const [rotationZ, setRotationZ] = useStorage<number>(
    "wheelRotationZ", 
    globalState.wheelSettings?.rotationZ || 0
  );
  
  const [scale, setScale] = useStorage<number>(
    "wheelScale", 
    globalState.wheelSettings?.scale || 0.01
  );
  
  // Lighting settings
  const [ambientIntensity, setAmbientIntensity] = useStorage<number>(
    "ambientIntensity", 
    globalState.lightingSettings?.ambientIntensity || 0.3
  );
  
  const [directionalIntensity, setDirectionalIntensity] = useStorage<number>(
    "directionalIntensity", 
    globalState.lightingSettings?.directionalIntensity || 0.7
  );
  
  // Main light position
  const [mainLightPosition, setMainLightPosition] = useStorage<[number, number, number]>(
    "mainLightPosition",
    globalState.lightingSettings?.mainLightPosition || [3, 8, 5]
  );
  
  // Fill light position and settings
  const [fillLightPosition, setFillLightPosition] = useStorage<[number, number, number]>(
    "fillLightPosition",
    globalState.lightingSettings?.fillLightPosition || [-5, 3, -5]
  );
  
  const [fillLightIntensity, setFillLightIntensity] = useStorage<number>(
    "fillLightIntensity", 
    globalState.lightingSettings?.fillLightIntensity || 0.3
  );
  
  // Shadow settings
  const [shadowMapSize, setShadowMapSize] = useStorage<number>(
    "shadowMapSize",
    globalState.shadowSettings?.mapSize || 2048
  );
  
  const [shadowBias, setShadowBias] = useStorage<number>(
    "shadowBias",
    globalState.shadowSettings?.bias || -0.0001
  );
  
  const [shadowRadius, setShadowRadius] = useStorage<number>(
    "shadowRadius",
    globalState.shadowSettings?.radius || 1
  );
  
  const [shadowOpacity, setShadowOpacity] = useStorage<number>(
    "shadowOpacity",
    globalState.shadowSettings?.opacity || 0.7
  );
  
  // Ground settings
  const [groundColor, setGroundColor] = useStorage<string>(
    "groundColor", 
    globalState.wheelSettings?.groundColor || "#444444"
  );
  
  const [groundVisible, setGroundVisible] = useStorage<boolean>(
    "groundVisible",
    globalState.wheelSettings?.groundVisible !== undefined ? 
      globalState.wheelSettings.groundVisible : true
  );
  
  // Camera settings storage
  const [cameraPosition, setCameraPosition] = useStorage<[number, number, number]>(
    "cameraPosition",
    globalState.cameraSettings?.position || [0, 0, 5]
  );
  
  const [cameraFov, setCameraFov] = useStorage<number>(
    "cameraFov",
    globalState.cameraSettings?.fov || 50
  );
  
  const [cameraZoom, setCameraZoom] = useStorage<number>(
    "cameraZoom",
    globalState.cameraSettings?.zoom || 1
  );
  
  // Orbit controls settings
  const [orbitMinDistance, setOrbitMinDistance] = useStorage<number>(
    "orbitMinDistance",
    globalState.cameraSettings?.minDistance || 1
  );
  
  const [orbitMaxDistance, setOrbitMaxDistance] = useStorage<number>(
    "orbitMaxDistance",
    globalState.cameraSettings?.maxDistance || 10
  );
  
  const [enableDamping, setEnableDamping] = useStorage<boolean>(
    "enableDamping",
    globalState.cameraSettings?.enableDamping !== undefined ? globalState.cameraSettings.enableDamping : true
  );
  
  // Show a notification with auto-dismiss
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      message,
      type,
      visible: true
    });
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);
  
  // Handle exporting localStorage
  const handleExportStorage = useCallback(() => {
    exportLocalStorageAsJson();
    showNotification('Settings exported successfully!', 'success');
  }, [showNotification]);
  
  // Handle importing from file
  const handleImportClick = useCallback(() => {
    // Trigger the file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle file selection
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    try {
      // Only accept JSON files
      if (!file.name.toLowerCase().endsWith('.json')) {
        showNotification('Please select a JSON file', 'error');
        return;
      }
      
      // Load the file and update global state
      const success = await loadStateFromFile(file);
      
      if (success) {
        showNotification('Settings imported successfully!', 'success');
        
        // Reset the file input to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showNotification('Failed to import settings', 'error');
      }
    } catch {
      showNotification('Error reading file', 'error');
    }
  }, [loadStateFromFile, showNotification]);
  
  // Handle reset to defaults
  const handleResetToDefaults = useCallback(async () => {
    try {
      await resetState();
      showNotification('Settings reset to defaults', 'info');
    } catch {
      showNotification('Failed to reset settings', 'error');
    }
  }, [resetState, showNotification]);
  
  // Handle fixing all panel positions
  const handleFixPanelPositions = useCallback(() => {
    resetPanelPositions();
    showNotification('Panel positions have been reset', 'info');
  }, [showNotification]);
  
  // Check for WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.error("WebGL not supported by your browser");
      }
    } catch (e) {
      console.error("Error checking WebGL support:", e);
    }
  }, []);
  
  // Main light position values for XYZ
  const [mainLightX, mainLightY, mainLightZ] = mainLightPosition;
  const [fillLightX, fillLightY, fillLightZ] = fillLightPosition;
  const [cameraX, cameraY, cameraZ] = cameraPosition;
  
  // Function to handle refreshing shadows
  const handleRefreshShadows = useCallback(() => {
    // Force refresh of renderer to apply shadow settings
    setShadowMapSize(prev => prev);
    showNotification('Shadow settings refreshed', 'info');
  }, [setShadowMapSize, showNotification]);
  
  // Function to reset camera position
  const handleResetCameraPosition = useCallback(() => {
    setCameraPosition([0, 0, 5]);
    setCameraFov(50);
    setCameraZoom(1);
    showNotification('Camera position reset', 'info');
  }, [setCameraPosition, setCameraFov, setCameraZoom, showNotification]);
  
  // Function to reset camera controls
  const handleResetCameraControls = useCallback(() => {
    setOrbitMinDistance(1);
    setOrbitMaxDistance(10);
    setEnableDamping(true);
    showNotification('Camera controls reset', 'info');
  }, [setOrbitMinDistance, setOrbitMaxDistance, setEnableDamping, showNotification]);
  
  // Set up all Leva controls in a single useControls call
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const allControls = useControls('Steering Wheel Controls', {
    'Wheel Model': folder({
      rotationX: {
        value: rotationX,
        min: 0,
        max: 360,
        step: 1,
        onChange: (value) => setRotationX(value)
      },
      rotationY: {
        value: rotationY,
        min: 0,
        max: 360,
        step: 1,
        onChange: (value) => setRotationY(value)
      },
      rotationZ: {
        value: rotationZ,
        min: 0,
        max: 360,
        step: 1,
        onChange: (value) => setRotationZ(value)
      },
      scale: {
        value: scale,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        onChange: (value) => setScale(value)
      }
    }, { collapsed: false }),
    
    'Lighting': folder({
      ambientIntensity: {
        value: ambientIntensity,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (value) => setAmbientIntensity(value)
      },
      directionalIntensity: {
        value: directionalIntensity,
        min: 0,
        max: 2,
        step: 0.05,
        onChange: (value) => setDirectionalIntensity(value)
      },
      fillLightIntensity: {
        value: fillLightIntensity,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (value) => setFillLightIntensity(value)
      },
      'Main Light Position': folder({
        mainLightX: {
          value: mainLightX,
          min: -10,
          max: 20,
          step: 0.5,
          onChange: (value) => setMainLightPosition([value, mainLightY, mainLightZ])
        },
        mainLightY: {
          value: mainLightY,
          min: -10,
          max: 20,
          step: 0.5,
          onChange: (value) => setMainLightPosition([mainLightX, value, mainLightZ])
        },
        mainLightZ: {
          value: mainLightZ,
          min: -10,
          max: 20,
          step: 0.5,
          onChange: (value) => setMainLightPosition([mainLightX, mainLightY, value])
        }
      }, { collapsed: true }),
      'Fill Light Position': folder({
        fillLightX: {
          value: fillLightX,
          min: -10,
          max: 10,
          step: 0.5,
          onChange: (value) => setFillLightPosition([value, fillLightY, fillLightZ])
        },
        fillLightY: {
          value: fillLightY,
          min: -10,
          max: 10,
          step: 0.5,
          onChange: (value) => setFillLightPosition([fillLightX, value, fillLightZ])
        },
        fillLightZ: {
          value: fillLightZ,
          min: -10,
          max: 10,
          step: 0.5,
          onChange: (value) => setFillLightPosition([fillLightX, fillLightY, value])
        }
      }, { collapsed: true }),
      groundColor: {
        value: groundColor,
        onChange: (value) => setGroundColor(value)
      },
      groundVisible: {
        value: groundVisible,
        onChange: (value) => setGroundVisible(value)
      }
    }, { collapsed: true }),
    
    'Shadow Settings': folder({
      shadowOpacity: {
        value: shadowOpacity,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (value) => setShadowOpacity(value)
      },
      shadowMapSize: {
        value: shadowMapSize,
        options: {
          "Low Quality (512px)": 512,
          "Medium Quality (1024px)": 1024,
          "High Quality (2048px)": 2048,
          "Ultra Quality (4096px)": 4096
        },
        onChange: (value) => setShadowMapSize(value)
      },
      shadowRadius: {
        value: shadowRadius,
        min: 0,
        max: 10,
        step: 0.1,
        onChange: (value) => setShadowRadius(value)
      },
      shadowBias: {
        value: shadowBias,
        min: -0.001,
        max: 0,
        step: 0.0001,
        onChange: (value) => setShadowBias(value)
      },
      'Refresh Shadows': button(() => handleRefreshShadows())
    }, { collapsed: true }),
    
    'Camera Controls': folder({
      'Camera Position': folder({
        cameraX: {
          value: cameraX,
          min: -20,
          max: 20,
          step: 0.1,
          onChange: (value) => setCameraPosition([value, cameraY, cameraZ])
        },
        cameraY: {
          value: cameraY,
          min: -20,
          max: 20,
          step: 0.1,
          onChange: (value) => setCameraPosition([cameraX, value, cameraZ])
        },
        cameraZ: {
          value: cameraZ,
          min: -20,
          max: 20,
          step: 0.1,
          onChange: (value) => setCameraPosition([cameraX, cameraY, value])
        }
      }, { collapsed: true }),
      cameraFov: {
        value: cameraFov,
        min: 10,
        max: 120,
        step: 1,
        label: 'Field of View (°)',
        onChange: (value) => setCameraFov(value)
      },
      cameraZoom: {
        value: cameraZoom,
        min: 0.1,
        max: 5,
        step: 0.1,
        onChange: (value) => setCameraZoom(value)
      },
      orbitMinDistance: {
        value: orbitMinDistance,
        min: 0.1,
        max: 5,
        step: 0.1,
        label: 'Min Distance',
        onChange: (value) => setOrbitMinDistance(value)
      },
      orbitMaxDistance: {
        value: orbitMaxDistance,
        min: 1,
        max: 20,
        step: 0.5,
        label: 'Max Distance',
        onChange: (value) => setOrbitMaxDistance(value)
      },
      enableDamping: {
        value: enableDamping,
        label: 'Enable Smooth Camera',
        onChange: (value) => setEnableDamping(value)
      },
      'Reset Position': button(() => handleResetCameraPosition()),
      'Reset Controls': button(() => handleResetCameraControls())
    }, { collapsed: true }),
    
    'Settings': folder({
      'Export Settings': button(() => handleExportStorage()),
      'Import Settings': button(() => handleImportClick()),
      'Reset to Defaults': button(() => handleResetToDefaults()),
      'Fix Panel Positions': button(() => handleFixPanelPositions())
    }, { collapsed: true })
  });
  
  return (
    <div className="w-screen h-screen bg-black fixed top-0 left-0">
      {/* Leva panel configuration - not hidden this time */}
      <Leva 
        fill
        titleBar={true}
        flat={false}
        collapsed={false}
        oneLineLabels={false}
        theme={{
          colors: {
            elevation1: '#222',
            elevation2: '#333',
            elevation3: '#444',
            accent1: '#0af',
            accent2: '#08f',
            accent3: '#06f',
            highlight1: '#fff',
            highlight2: '#fff',
            highlight3: '#fff'
          }
        }}
      />
      
      {/* Three.js scene with global state integration */}
      <Canvas 
        className="w-full h-full"
        shadows={{ 
          type: THREE.PCFSoftShadowMap, 
          enabled: true 
        }}
        gl={{ 
          preserveDrawingBuffer: true, 
          antialias: true,
          alpha: false, // Disable alpha to force a solid background
          logarithmicDepthBuffer: true, // Improve shadow precision
          stencil: true // Required for some shadow effects
        }}
        dpr={[1, 2]} // Improve rendering quality on high DPI screens
        camera={{ position: [0, 0, 5], fov: 50 }} // Default camera setup (overridden by CameraControls)
      >
        {/* Camera with saved position and settings */}
        <CameraControls 
          cameraPosition={cameraPosition}
          setCameraPosition={setCameraPosition}
          cameraFov={cameraFov}
          cameraZoom={cameraZoom}
          orbitMinDistance={orbitMinDistance}
          orbitMaxDistance={orbitMaxDistance}
          enableDamping={enableDamping}
        />
        
        {/* Scene background color */}
        <color attach="background" args={["#444444"]} />
        
        {/* Steering wheel model with stored rotation from global state + localStorage */}
        <group 
          rotation={[
            THREE.MathUtils.degToRad(rotationX), 
            THREE.MathUtils.degToRad(rotationY), 
            THREE.MathUtils.degToRad(rotationZ)
          ]}
          castShadow
        >
          <ModelLoader 
            modelPath="/models/NRGWheel.gltf"
            scale={scale}
            castShadow={true}
            receiveShadow={true}
          />
        </group>
        
        {/* Enhanced ground plane with better shadow reception - conditionally rendered */}
        {groundVisible && (
          <mesh 
            position={[0, -1, 0]} 
            rotation={[-Math.PI/2, 0, 0]} 
            receiveShadow
          >
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial 
              color={groundColor} 
              roughness={0.8}
              metalness={0.2}
              side={THREE.DoubleSide}
              transparent={true}
              opacity={1.0} // Fully opaque ground
            />
          </mesh>
        )}
        
        {/* Shadow catcher - separate from ground plane */}
        <mesh 
          position={[0, -0.999, 0]} 
          rotation={[-Math.PI/2, 0, 0]} 
          receiveShadow
        >
          <planeGeometry args={[50, 50]} />
          <shadowMaterial 
            transparent={true} 
            opacity={shadowOpacity} 
            color="black" 
          />
        </mesh>
        
        {/* Ambient lighting */}
        <ambientLight intensity={ambientIntensity} />
        
        {/* Main light with enhanced shadow settings - using saved position and settings */}
        <MainDirectionalLight 
          position={mainLightPosition} 
          intensity={directionalIntensity} 
          shadowMapSize={shadowMapSize}
          shadowBias={shadowBias}
          shadowRadius={shadowRadius}
        />
        
        {/* Fill light for better visibility - using saved position and intensity */}
        <directionalLight 
          position={fillLightPosition} 
          intensity={fillLightIntensity} 
        />
        
        {/* Environment for reflections */}
        <Environment preset="studio" />
      </Canvas>

      {/* Hidden file input for importing */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      
      {/* Notification overlay */}
      {notification.visible && (
        <div 
          className={`fixed bottom-4 right-4 p-3 rounded shadow-md z-50 ${
            notification.type === 'success' ? 'bg-green-100 border border-green-500 text-green-700' : 
            notification.type === 'error' ? 'bg-red-100 border border-red-500 text-red-700' :
            'bg-blue-100 border border-blue-500 text-blue-700'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
});