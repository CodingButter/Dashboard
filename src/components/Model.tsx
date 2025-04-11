
import { useLoader } from '@react-three/fiber';
import  { Suspense } from 'react';
import React from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
// Create simple props interface
export interface IOBJModelProps extends React.ComponentProps<'group'>{
  modelPath: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}  
export default function Model({ modelPath, ...props }: IOBJModelProps) {
  const { scene } =  useLoader(GLTFLoader, modelPath)
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  return (
    <Suspense fallback={<group />}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </Suspense>
  )

  
}