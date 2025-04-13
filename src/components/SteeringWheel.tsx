import React, { useEffect, useState, useCallback, useRef } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Environment, useHelper } from "@react-three/drei"
import { useControls, button, folder, Leva } from "leva"
import { useStorage } from "../hooks/useStorage"
import { useGlobalState } from "../hooks/useGlobalState"
import { exportLocalStorageAsJson } from "../utils/storageUtils"
import { resetPanelPositions } from "../utils/controlStateManager"
import * as THREE from "three"
import ModelLoader from "./common/ModelLoader"
import DraggablePanel from "./common/DraggablePanel"

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
export default React.memo(function SteeringWheel() {
  // Access the global state using our new hook
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
  
  const [panelPosition, setPanelPosition] = useStorage<{x: number, y: number}>(
    "panelPosition", 
    globalState.wheelSettings?.panelPosition || { x: 20, y: 20 }
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
  
  // Set up Leva controls with our storage hooks
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const wheelControls = useControls({
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
    }),
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
        max: 1,
        step: 0.05,
        onChange: (value) => setDirectionalIntensity(value)
      },
      groundColor: {
        value: groundColor,
        onChange: (value) => setGroundColor(value)
      }
    }),
    'Settings Management': folder({
      panelPosition: {
        value: panelPosition,
        onChange: (value) => setPanelPosition(value),
        joystick: 'invertY'
      },
      'Export Settings': button(() => handleExportStorage()),
      'Import Settings': button(() => handleImportClick()),
      'Reset to Defaults': button(() => handleResetToDefaults())
    })
  });

  // Storage for separate panel positions
  // Panel positions storage
  const [wheelPanelPosition, setWheelPanelPosition] = useStorage<{x: number, y: number}>(
    "wheelPanelPosition", 
    { x: 20, y: 20 }
  );
  
  const [lightingPanelPosition, setLightingPanelPosition] = useStorage<{x: number, y: number}>(
    "lightingPanelPosition", 
    { x: 350, y: 20 }
  );
  
  const [cameraPanelPosition, setCameraPanelPosition] = useStorage<{x: number, y: number}>(
    "cameraPanelPosition", 
    { x: 20, y: 300 }
  );
  
  const [settingsPanelPosition, setSettingsPanelPosition] = useStorage<{x: number, y: number}>(
    "settingsPanelPosition", 
    { x: 350, y: 300 }
  );
  
  const [shadowPanelPosition, setShadowPanelPosition] = useStorage<{x: number, y: number}>(
    "shadowPanelPosition", 
    { x: 680, y: 20 }
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
  
  // Handle fixing all panel positions
  const handleFixPanelPositions = useCallback(() => {
    resetPanelPositions();
    showNotification('Panel positions have been reset', 'info');
  }, [showNotification]);

  return (
    <div className="w-screen h-screen bg-black fixed top-0 left-0">
      {/* Hide the built-in Leva panel - we'll use our custom panels instead */}
      <div className="hidden">
        <Leva 
          hidden={true}
          titleBar={false}
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
      </div>
      
      {/* Custom control panels using our new DraggablePanel component */}
      <DraggablePanel 
        title="Wheel Model Controls"
        componentName="SteeringWheel"
        panelId="wheel"
        initialPosition={wheelPanelPosition}
        onPositionChange={setWheelPanelPosition}
        theme="dark"
        initialWidth={320}
        initialHeight="auto"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rotation X</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              step="1"
              value={rotationX}
              onChange={(e) => setRotationX(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0°</span>
              <span>{rotationX}°</span>
              <span>360°</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rotation Y</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              step="1"
              value={rotationY}
              onChange={(e) => setRotationY(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0°</span>
              <span>{rotationY}°</span>
              <span>360°</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rotation Z</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              step="1"
              value={rotationZ}
              onChange={(e) => setRotationZ(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0°</span>
              <span>{rotationZ}°</span>
              <span>360°</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Scale</label>
            <input 
              type="range" 
              min="0.001" 
              max="0.1" 
              step="0.001"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.001</span>
              <span>{scale.toFixed(3)}</span>
              <span>0.1</span>
            </div>
          </div>
        </div>
      </DraggablePanel>
      
      <DraggablePanel 
        title="Lighting Controls"
        componentName="SteeringWheel"
        panelId="lighting"
        initialPosition={lightingPanelPosition}
        onPositionChange={setLightingPanelPosition}
        theme="dark"
        initialWidth={320}
        initialHeight="auto"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ambient Light</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={ambientIntensity}
              onChange={(e) => setAmbientIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{ambientIntensity.toFixed(2)}</span>
              <span>1</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Main Light Intensity</label>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.05"
              value={directionalIntensity}
              onChange={(e) => setDirectionalIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{directionalIntensity.toFixed(2)}</span>
              <span>2</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fill Light Intensity</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={fillLightIntensity}
              onChange={(e) => setFillLightIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{fillLightIntensity.toFixed(2)}</span>
              <span>1</span>
            </div>
          </div>
          
          {/* Main Light Position Controls */}
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Main Light Position</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-400">X</label>
                <input 
                  type="number" 
                  value={mainLightPosition[0]}
                  onChange={(e) => {
                    const newPos = [...mainLightPosition] as [number, number, number];
                    newPos[0] = Number(e.target.value);
                    setMainLightPosition(newPos);
                  }}
                  className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400">Y</label>
                <input 
                  type="number"
                  value={mainLightPosition[1]}
                  onChange={(e) => {
                    const newPos = [...mainLightPosition] as [number, number, number];
                    newPos[1] = Number(e.target.value);
                    setMainLightPosition(newPos);
                  }}
                  className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400">Z</label>
                <input 
                  type="number"
                  value={mainLightPosition[2]}
                  onChange={(e) => {
                    const newPos = [...mainLightPosition] as [number, number, number];
                    newPos[2] = Number(e.target.value);
                    setMainLightPosition(newPos);
                  }}
                  className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                  step="0.5"
                />
              </div>
            </div>
          </div>
          
          {/* Fill Light Position Controls */}
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Fill Light Position</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-400">X</label>
                <input 
                  type="number"
                  value={fillLightPosition[0]}
                  onChange={(e) => {
                    const newPos = [...fillLightPosition] as [number, number, number];
                    newPos[0] = Number(e.target.value);
                    setFillLightPosition(newPos);
                  }}
                  className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400">Y</label>
                <input 
                  type="number"
                  value={fillLightPosition[1]}
                  onChange={(e) => {
                    const newPos = [...fillLightPosition] as [number, number, number];
                    newPos[1] = Number(e.target.value);
                    setFillLightPosition(newPos);
                  }}
                  className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400">Z</label>
                <input 
                  type="number"
                  value={fillLightPosition[2]}
                  onChange={(e) => {
                    const newPos = [...fillLightPosition] as [number, number, number];
                    newPos[2] = Number(e.target.value);
                    setFillLightPosition(newPos);
                  }}
                  className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                  step="0.5"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ground Color</label>
            <div className="flex items-center space-x-2">
              <input 
                type="color" 
                value={groundColor}
                onChange={(e) => setGroundColor(e.target.value)}
                className="w-8 h-8 border-0 rounded cursor-pointer"
              />
              <span className="text-gray-300">{groundColor}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="groundVisible"
              checked={groundVisible}
              onChange={(e) => setGroundVisible(e.target.checked)}
              className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
            />
            <label htmlFor="groundVisible" className="ml-2 text-sm font-medium text-gray-300">
              Show Ground Plane
            </label>
          </div>
        </div>
      </DraggablePanel>
      
      {/* New Shadow Settings Panel */}
      <DraggablePanel 
        title="Shadow Settings"
        componentName="SteeringWheel"
        panelId="shadow"
        initialPosition={shadowPanelPosition}
        onPositionChange={setShadowPanelPosition}
        theme="dark"
        initialWidth={320}
        initialHeight="auto"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Shadow Opacity</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={shadowOpacity}
              onChange={(e) => setShadowOpacity(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{shadowOpacity.toFixed(2)}</span>
              <span>1</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Shadow Map Size</label>
            <select 
              value={shadowMapSize}
              onChange={(e) => setShadowMapSize(Number(e.target.value))}
              className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
            >
              <option value={512}>512px (Low Quality)</option>
              <option value={1024}>1024px (Medium Quality)</option>
              <option value={2048}>2048px (High Quality)</option>
              <option value={4096}>4096px (Ultra Quality)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Shadow Radius (Softness)</label>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.1"
              value={shadowRadius}
              onChange={(e) => setShadowRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Sharp</span>
              <span>{shadowRadius.toFixed(1)}</span>
              <span>Soft</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Shadow Bias</label>
            <input 
              type="range" 
              min="-0.001" 
              max="0" 
              step="0.0001"
              value={shadowBias}
              onChange={(e) => setShadowBias(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-0.001</span>
              <span>{shadowBias.toFixed(5)}</span>
              <span>0</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-2 italic">
            Note: Higher quality shadows require more performance.
          </div>
          
          <button 
            onClick={() => {
              // Force refresh of renderer to apply shadow settings
              // This is just a state update to trigger a re-render
              setShadowMapSize(prev => prev);
              showNotification('Shadow settings refreshed', 'info');
            }}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md mt-2"
          >
            Refresh Shadows
          </button>
        </div>
      </DraggablePanel>
      
      <DraggablePanel 
        title="Camera Controls"
        componentName="SteeringWheel"
        panelId="camera"
        initialPosition={cameraPanelPosition}
        onPositionChange={setCameraPanelPosition}
        theme="dark"
        initialWidth={320}
        initialHeight="auto"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Position X</label>
              <input 
                type="number" 
                value={cameraPosition[0]}
                onChange={(e) => {
                  const newPos = [...cameraPosition] as [number, number, number];
                  newPos[0] = Number(e.target.value);
                  setCameraPosition(newPos);
                }}
                className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                step="0.1"
                min="-20"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Position Y</label>
              <input 
                type="number" 
                value={cameraPosition[1]}
                onChange={(e) => {
                  const newPos = [...cameraPosition] as [number, number, number];
                  newPos[1] = Number(e.target.value);
                  setCameraPosition(newPos);
                }}
                className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                step="0.1"
                min="-20"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Position Z</label>
              <input 
                type="number" 
                value={cameraPosition[2]}
                onChange={(e) => {
                  const newPos = [...cameraPosition] as [number, number, number];
                  newPos[2] = Number(e.target.value);
                  setCameraPosition(newPos);
                }}
                className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                step="0.1"
                min="-20"
                max="20"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Field of View (FOV)</label>
            <input 
              type="range" 
              min="10" 
              max="120" 
              step="1"
              value={cameraFov}
              onChange={(e) => setCameraFov(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10°</span>
              <span>{cameraFov}°</span>
              <span>120°</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Camera Zoom</label>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1"
              value={cameraZoom}
              onChange={(e) => setCameraZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1x</span>
              <span>{cameraZoom.toFixed(1)}x</span>
              <span>5x</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Min Distance</label>
              <input 
                type="number" 
                value={orbitMinDistance}
                onChange={(e) => setOrbitMinDistance(Number(e.target.value))}
                className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                step="0.5"
                min="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Distance</label>
              <input 
                type="number" 
                value={orbitMaxDistance}
                onChange={(e) => setOrbitMaxDistance(Number(e.target.value))}
                className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
                step="1"
                min="1"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="enableDamping"
              checked={enableDamping}
              onChange={(e) => setEnableDamping(e.target.checked)}
              className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
            />
            <label htmlFor="enableDamping" className="ml-2 text-sm font-medium text-gray-300">
              Enable Damping (Smooth Camera)
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                // Reset camera to default position
                setCameraPosition([0, 0, 5]);
                setCameraFov(50);
                setCameraZoom(1);
                showNotification('Camera position reset', 'info');
              }}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md mt-2"
            >
              Reset Position
            </button>
            
            <button 
              onClick={() => {
                setOrbitMinDistance(1);
                setOrbitMaxDistance(10);
                setEnableDamping(true);
                showNotification('Camera controls reset', 'info');
              }}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md mt-2"
            >
              Reset Controls
            </button>
          </div>
        </div>
      </DraggablePanel>
      
      <DraggablePanel 
        title="Settings"
        componentName="SteeringWheel"
        panelId="settings"
        initialPosition={settingsPanelPosition}
        onPositionChange={setSettingsPanelPosition}
        theme="dark"
        initialWidth={320}
        initialHeight="auto"
      >
        <div className="space-y-3">
          <button 
            onClick={handleExportStorage}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Export Settings
          </button>
          
          <button 
            onClick={handleImportClick}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
          >
            Import Settings
          </button>
          
          <button 
            onClick={handleResetToDefaults}
            className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md"
          >
            Reset to Defaults
          </button>
          
          <button 
            onClick={handleFixPanelPositions}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md"
          >
            Fix Panel Positions
          </button>
        </div>
      </DraggablePanel>
      
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
            onLoad={() => {
              // Model loaded successfully (no logging to avoid large objects)
            }}
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
}, () => {
  // Always return true to prevent re-renders from parent
  // All our state is managed internally and via hooks
  return true;
});