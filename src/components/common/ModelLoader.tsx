import { Suspense, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export interface IModelLoaderProps extends React.ComponentProps<'group'> {
  modelPath: string;
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  onLoad?: (model: THREE.Group) => void;
  material?: THREE.Material; // Added option to override materials
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
  const { scene } = useLoader(GLTFLoader, modelPath);

  // Apply shadow properties to all meshes
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          
          // Ensure shadow casting is properly set
          mesh.castShadow = castShadow;
          mesh.receiveShadow = receiveShadow;
          
          // Set high-quality shadow settings
          if (castShadow) {
            mesh.frustumCulled = false; // Prevent shadow disappearance
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
      
      // Call onLoad callback with the loaded model
      if (onLoad) {
        onLoad(scene);
      }
    }
  }, [scene, castShadow, receiveShadow, onLoad, material]);

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

  return (
    <Suspense fallback={<group />}>
      <group 
        scale={formattedScale} 
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        {...props}
      >
        <primitive object={scene} />
      </group>
    </Suspense>
  );
}