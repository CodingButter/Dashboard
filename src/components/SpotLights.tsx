import { useRef, useEffect } from 'react'
import { SpotLightHelper, Object3D, SpotLight } from 'three'

export interface ISpotLightProps extends React.ComponentProps<'spotLight'>{
    position?: [number, number, number];
    target?: Object3D;
    showHelper?: boolean;
}

export default function SpotLights({ position, rotation, target, showHelper = false, ...props }: ISpotLightProps) {
    const lightRef = useRef<SpotLight>(null!)
    
    // Use helper in an effect to avoid conditional hook issues
    useEffect(() => {
        if (showHelper && lightRef.current) {
            const currentLight = lightRef.current
            const helper = new SpotLightHelper(currentLight, "red")
            
            if (currentLight.parent) {
                currentLight.parent.add(helper)
                
                return () => {
                    helper.dispose()
                    if (currentLight.parent) {
                        currentLight.parent.remove(helper)
                    }
                }
            }
        }
        return undefined
    }, [showHelper])
    
    return (
        <spotLight
            ref={lightRef}
            castShadow
            {...props}
            position={position}
            rotation={rotation}
            target={target || undefined}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
        />
    )
}