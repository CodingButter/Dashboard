import { Suspense, useEffect, useState, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

export interface IModelLoaderProps extends React.ComponentProps<'group'> {
  modelPath: string;
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  onLoad?: (model: THREE.Group) => void;
  material?: THREE.Material; // Added option to override materials
}

// Separate model components for different file types to comply with React hooks rules
function GltfModel({ path, onError, onSuccess }: { path: string, onError: (err: string) => void, onSuccess: (model: THREE.Group) => void }) {
  try {
    const gltf = useLoader(
      GLTFLoader, 
      path, 
      undefined,
      (e) => {
        // Just send the error message without logging the full error object
        onError(`GLTF loading error: ${e instanceof Error ? e.message : String(e)}`);
      }
    );
    
    if (gltf && gltf.scene) {
      // Store the loaded model for later use
      onSuccess(gltf.scene);
      return <primitive object={gltf.scene} />;
    }
  } catch (e) {
    onError(`Failed to load GLTF: ${e}`);
  }
  
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

function ObjModel({ path, onError, onSuccess }: { path: string, onError: (err: string) => void, onSuccess: (model: THREE.Group) => void }) {
  try {
    const obj = useLoader(
      OBJLoader, 
      path, 
      undefined,
      (e) => {
        // Just send the error message without logging the full error object
        onError(`OBJ loading error: ${e instanceof Error ? e.message : String(e)}`);
      }
    );
    
    if (obj) {
      // Store the loaded model for later use
      onSuccess(obj);
      return <primitive object={obj} />;
    }
  } catch (e) {
    onError(`Failed to load OBJ: ${e}`);
  }
  
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

export default function ModelLoader({ 
  modelPath, 
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  onLoad,
  material,
  ...props 
}: IModelLoaderProps) {
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  
  // Determine which loader to use based on file extension
  const getFileExtension = (path: string) => {
    return path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
  };
  
  const fileExtension = getFileExtension(modelPath);

  // Try using OBJ model with v1 version if the main model fails
  useEffect(() => {
    // If there's an error and the file is GLTF, try loading the fallback OBJ version
    if (error && fileExtension === 'gltf') {
      const fallbackPath = modelPath.replace('.gltf', ' v1.obj');
      
      try {
        const objLoader = new OBJLoader();
        objLoader.load(
          fallbackPath,
          (obj) => {
            modelRef.current = obj;
            setError(null); // Clear error if fallback works
            
            // Apply shadows and materials directly here
            obj.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = castShadow;
                mesh.receiveShadow = receiveShadow;
              }
            });
            
            if (onLoad) onLoad(obj);
          },
          // Progress handler (silently track progress without logging)
          () => {},
          () => {
            // If both GLTF and OBJ fail, we're stuck with the error
            // Don't log or use the error to avoid large objects in console
          }
        );
      } catch {
        // Silently handle fallback errors without logging large model objects
      }
    }
  }, [error, fileExtension, modelPath, onLoad, castShadow, receiveShadow]);
  
  // Handle model cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      if (modelRef.current) {
        // Clean up geometries and materials on unmount
        modelRef.current.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            
            // Dispose geometry
            if (mesh.geometry) {
              mesh.geometry.dispose();
            }
            
            // Dispose materials
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
    };
  }, []);

  // Apply shadow properties to all meshes - optimized for performance
  useEffect(() => {
    const currentModel = modelRef.current;
    if (currentModel) {
      currentModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          
          // Ensure shadow casting is properly set
          mesh.castShadow = castShadow;
          mesh.receiveShadow = receiveShadow;
          
          // Only disable frustum culling if really needed for shadows
          // This improves performance by allowing Three.js to skip rendering off-screen objects
          if (castShadow && mesh.geometry.boundingSphere && mesh.geometry.boundingSphere.radius > 5) {
            mesh.frustumCulled = false;
          } else {
            mesh.frustumCulled = true; // Enable culling for better performance
          }
          
          // Apply custom material if provided
          if (material) {
            mesh.material = material;
          } else if (mesh.material) {
            // Make sure existing materials are configured for shadows
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                configureMaterial(mat);
              });
            } else {
              configureMaterial(mesh.material);
            }
          }
        }
      });
      
      // Call onLoad callback with the loaded model if provided
      if (onLoad) {
        // Only indicate success, don't pass the entire model
        onLoad(currentModel);
      }
    }
  }, [castShadow, receiveShadow, onLoad, material]);

  // Helper function to configure materials for better shadows
  const configureMaterial = (material: THREE.Material) => {
    if (material) {
      material.shadowSide = THREE.FrontSide;
      
      // For meshStandardMaterial, ensure proper shadow settings
      if ((material as THREE.MeshStandardMaterial).metalness !== undefined) {
        const stdMat = material as THREE.MeshStandardMaterial;
        if (stdMat.roughness !== undefined && stdMat.roughness < 0.2) {
          stdMat.roughness = Math.max(0.2, stdMat.roughness);
        }
      }
    }
  };

  // Format scale as a proper Vector3 tuple
  const formattedScale = typeof scale === 'number' 
    ? [scale, scale, scale] as [number, number, number]
    : scale;

  // If there's an error and no model loaded yet (both GLTF and OBJ failed), show a placeholder
  if (error && !modelRef.current) {
    // Don't log specific error - avoid large model objects in logs
    
    return (
      <group 
        scale={formattedScale} 
        {...props}
      >
        {/* Error placeholder */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <group position={[0, 1.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="red" />
          </mesh>
        </group>
      </group>
    );
  }

  // Set up model success handler
  const handleModelSuccess = (model: THREE.Group) => {
    modelRef.current = model;
    if (onLoad) {
      onLoad(model);
    }
  };

  // Render the loaded model based on file extension
  return (
    <Suspense fallback={
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="blue" wireframe />
      </mesh>
    }>
      <group 
        scale={formattedScale} 
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        {...props}
      >
        {fileExtension === 'gltf' ? (
          <GltfModel path={modelPath} onError={setError} onSuccess={handleModelSuccess} />
        ) : fileExtension === 'obj' ? (
          <ObjModel path={modelPath} onError={setError} onSuccess={handleModelSuccess} />
        ) : (
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="red" />
            <meshStandardMaterial color="red" />
          </mesh>
        )}
      </group>
    </Suspense>
  );
}