import { useRef } from 'react'
import { useHelper } from '@react-three/drei'
import { SpotLightHelper } from 'three'
export interface IOBJModelProps extends React.ComponentProps<'directionalLight'>{
    position?: [number, number, number];
}

export default function SpotLight({ position, rotation, ...props }: IOBJModelProps) {
    const lightRef = useRef(null!)
    useHelper(lightRef, SpotLightHelper, "red")
  return (
    <SpotLight
     ref={lightRef}
      castShadow
      {...props}
      position={position}
      rotation={rotation}
      dispose={null}
    />
  )
}