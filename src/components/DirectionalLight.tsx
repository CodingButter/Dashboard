import { useRef } from 'react'
import { useHelper } from '@react-three/drei'
import { DirectionalLight as directionallight, DirectionalLightHelper } from 'three'
export interface IOBJModelProps extends React.ComponentProps<'directionalLight'>{
    position?: [number, number, number];
}

export default function DirectionalLight({ position, rotation, ...props }: IOBJModelProps) {
    const lightRef = useRef<directionallight>(null!)
    useHelper(lightRef, DirectionalLightHelper, 5, 'red')
  return (
    <directionalLight
     ref={lightRef}
      castShadow
      {...props}
      position={position}
      rotation={rotation}
      dispose={null}
    />
  )
}