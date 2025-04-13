import React, { useEffect, useState, useCallback, useRef } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { PerspectiveCamera, OrbitControls, Environment, useHelper } from "@react-three/drei"
import { useControls, button, folder, Leva } from "leva"
import { useStorage } from "../hooks/useStorage"
import { useGlobalState } from "../hooks/useGlobalState"
import { exportLocalStorageAsJson } from "../utils/storageUtils"
import { resetPanelPositions } from "../utils/controlStateManager"
import * as THREE from "three"
import { 
  ModelLoader, 
  SliderControl, 
  ColorControl, 
  ToggleControl, 
  VectorControl,
  UnifiedControlPanel
} from "./common"

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
export default function UnifiedSteeringWheel() {
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
  
  // Panel position
  const [controlPanelPosition, setControlPanelPosition] = useStorage<{x: number, y: number}>(
    "controlPanelPosition", 
    { x: 20, y: 20 }
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
  
  // Reset camera position
  const handleResetCamera = useCallback(() => {
    setCameraPosition([0, 0, 5]);
    setCameraFov(50);
    setCameraZoom(1);
    showNotification('Camera position reset', 'info');
  }, [setCameraPosition, setCameraFov, setCameraZoom, showNotification]);
  
  // Reset camera controls
  const handleResetCameraControls = useCallback(() => {
    setOrbitMinDistance(1);
    setOrbitMaxDistance(10);
    setEnableDamping(true);
    showNotification('Camera controls reset', 'info');
  }, [setOrbitMinDistance, setOrbitMaxDistance, setEnableDamping, showNotification]);
  
  // Force refresh shadows
  const handleRefreshShadows = useCallback(() => {
    setShadowMapSize(prev => prev);
    showNotification('Shadow settings refreshed', 'info');
  }, [setShadowMapSize, showNotification]);
  
  // Prepare section contents
  const wheelModelContent = (
    <>
      <SliderControl
        label="Rotation X"
        value={rotationX}
        onChange={setRotationX}
        min={0}
        max={360}
        step={1}
        displayPrecision={0}
        unit="°"
      />
      
      <SliderControl
        label="Rotation Y"
        value={rotationY}
        onChange={setRotationY}
        min={0}
        max={360}
        step={1}
        displayPrecision={0}
        unit="°"
      />
      
      <SliderControl
        label="Rotation Z"
        value={rotationZ}
        onChange={setRotationZ}
        min={0}
        max={360}
        step={1}
        displayPrecision={0}
        unit="°"
      />
      
      <SliderControl
        label="Scale"
        value={scale}
        onChange={setScale}
        min={0.001}
        max={0.1}
        step={0.001}
        displayPrecision={3}
      />
    </>
  );
  
  const lightingContent = (
    <>
      <SliderControl
        label="Ambient Light"
        value={ambientIntensity}
        onChange={setAmbientIntensity}
        min={0}
        max={1}
        step={0.05}
        displayPrecision={2}
      />
      
      <SliderControl
        label="Main Light Intensity"
        value={directionalIntensity}
        onChange={setDirectionalIntensity}
        min={0}
        max={2}
        step={0.05}
        displayPrecision={2}
      />
      
      <SliderControl
        label="Fill Light Intensity"
        value={fillLightIntensity}
        onChange={setFillLightIntensity}
        min={0}
        max={1}
        step={0.05}
        displayPrecision={2}
      />
      
      <VectorControl
        label="Main Light Position"
        value={mainLightPosition}
        onChange={setMainLightPosition}
        min={-10}
        max={20}
        step={0.5}
      />
      
      <VectorControl
        label="Fill Light Position"
        value={fillLightPosition}
        onChange={setFillLightPosition}
        min={-10}
        max={10}
        step={0.5}
      />
      
      <ColorControl
        label="Ground Color"
        value={groundColor}
        onChange={setGroundColor}
      />
      
      <ToggleControl
        label="Show Ground Plane"
        value={groundVisible}
        onChange={setGroundVisible}
        id="groundVisible"
      />
    </>
  );
  
  const shadowContent = (
    <>
      <SliderControl
        label="Shadow Opacity"
        value={shadowOpacity}
        onChange={setShadowOpacity}
        min={0}
        max={1}
        step={0.05}
        displayPrecision={2}
      />
      
      <div className="mb-3">
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
      
      <SliderControl
        label="Shadow Radius (Softness)"
        value={shadowRadius}
        onChange={setShadowRadius}
        min={0}
        max={10}
        step={0.1}
        displayPrecision={1}
      />
      
      <SliderControl
        label="Shadow Bias"
        value={shadowBias}
        onChange={setShadowBias}
        min={-0.001}
        max={0}
        step={0.0001}
        displayPrecision={5}
      />
      
      <div className="text-xs text-gray-400 mt-2 italic mb-2">
        Note: Higher quality shadows require more performance.
      </div>
      
      <button 
        onClick={handleRefreshShadows}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
      >
        Refresh Shadows
      </button>
    </>
  );
  
  const cameraContent = (
    <>
      <VectorControl
        label="Camera Position"
        value={cameraPosition}
        onChange={setCameraPosition}
        min={-20}
        max={20}
        step={0.1}
      />
      
      <SliderControl
        label="Field of View (FOV)"
        value={cameraFov}
        onChange={setCameraFov}
        min={10}
        max={120}
        step={1}
        displayPrecision={0}
        unit="°"
      />
      
      <SliderControl
        label="Camera Zoom"
        value={cameraZoom}
        onChange={setCameraZoom}
        min={0.1}
        max={5}
        step={0.1}
        displayPrecision={1}
        unit="x"
      />
      
      <div className="grid grid-cols-2 gap-2 mb-3">
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
      
      <ToggleControl
        label="Enable Damping (Smooth Camera)"
        value={enableDamping}
        onChange={setEnableDamping}
        id="enableDamping"
      />
      
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button 
          onClick={handleResetCamera}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
        >
          Reset Position
        </button>
        
        <button 
          onClick={handleResetCameraControls}
          className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
        >
          Reset Controls
        </button>
      </div>
    </>
  );
  
  const settingsContent = (
    <>
      <button 
        onClick={handleExportStorage}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md mb-2"
      >
        Export Settings
      </button>
      
      <button 
        onClick={handleImportClick}
        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md mb-2"
      >
        Import Settings
      </button>
      
      <button 
        onClick={handleResetToDefaults}
        className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md mb-2"
      >
        Reset to Defaults
      </button>
      
      <button 
        onClick={handleFixPanelPositions}
        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md"
      >
        Fix Panel Positions
      </button>
    </>
  );
  
  // Defined sections for the unified panel
  const sections = [
    {
      id: 'wheelModel',
      title: 'Wheel Model',
      initialCollapsed: false,
      content: wheelModelContent
    },
    {
      id: 'lighting',
      title: 'Lighting',
      initialCollapsed: true,
      content: lightingContent
    },
    {
      id: 'shadow',
      title: 'Shadow Settings',
      initialCollapsed: true,
      content: shadowContent
    },
    {
      id: 'camera',
      title: 'Camera Controls',
      initialCollapsed: true,
      content: cameraContent
    },
    {
      id: 'settings',
      title: 'Settings',
      initialCollapsed: true,
      content: settingsContent
    }
  ];
  
  return (
    <div className="w-screen h-screen bg-black fixed top-0 left-0">
      {/* Hide the built-in Leva panel - we use custom panels instead */}
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
      
      {/* Unified Control Panel */}
      <UnifiedControlPanel
        title="Steering Wheel Controls"
        componentName="SteeringWheel"
        panelId="unified"
        initialPosition={controlPanelPosition}
        initialCollapsed={false}
        onPositionChange={setControlPanelPosition}
        theme="dark"
        initialWidth={350}
        initialHeight="auto"
        sections={sections}
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
            onLoad={() => {
              // Model loaded successfully
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
}