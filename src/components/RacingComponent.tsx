import { ReactNode, forwardRef } from 'react'
import * as THREE from 'three'
import { degreesToRadians } from '@utils/math'

interface IRacingComponentProps extends React.ComponentProps<'group'> {
  children?: ReactNode;
  rotation?: number;
  rotationAxis?: [number, number, number];
  scale?: number | [number, number, number];
}

// Base racing component that handles common props and behaviors
const RacingComponent = forwardRef<THREE.Group, IRacingComponentProps>(
  ({ 
    children, 
    rotation = 0, 
    rotationAxis = [0, 0, 1], 
    scale = 1,
    ...props 
  }, ref) => {
    // Calculate rotation in radians
    const [axisX, axisY, axisZ] = rotationAxis;
    
    // Create a proper THREE.js Euler for rotation
    const eulerRotation = new THREE.Euler(
      axisX ? degreesToRadians(rotation * axisX) : 0,
      axisY ? degreesToRadians(rotation * axisY) : 0,
      axisZ ? degreesToRadians(rotation * axisZ) : 0
    );
    
    // Handle scale formatting
    const scaleValue = typeof scale === 'number' ? [scale, scale, scale] as [number, number, number] : scale;
    
    return (
      <group
        ref={ref}
        rotation={eulerRotation}
        scale={scaleValue}
        castShadow
        receiveShadow
        {...props}
      >
        {children}
      </group>
    );
  }
);

RacingComponent.displayName = 'RacingComponent';

export default RacingComponent;