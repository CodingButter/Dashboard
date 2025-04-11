import { useEffect, useRef } from "react"
import * as THREE from "three"

// Add proper type definitions
type OBJModelProps = {
  objPath?: string
  mtlPath?: string
  texturePath?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  objFile?: string // Alternate prop name
  mtlFile?: string // Alternate prop name
}

const OBJModel = ({
  objPath,
  mtlPath,
  texturePath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  objFile,
  mtlFile,
}: OBJModelProps) => {
  // Use either objPath or objFile, and either mtlPath or mtlFile
  const finalObjPath = objPath || objFile
  const finalMtlPath = mtlPath || mtlFile
  // Fix the ref typing
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    // Store the current value of groupRef to use in cleanup
    const currentGroup = groupRef.current

    const loadModel = async () => {
      try {
        // Check if we have a valid path
        if (!finalObjPath) {
          console.error("No OBJ file path provided")
          return
        }
        // Import loaders with type assertions to fix module resolution
        const module = await import("three/examples/jsm/loaders/OBJLoader.js")
        const OBJLoader = module.OBJLoader

        // Only import MTLLoader if mtlPath is provided
        let object: THREE.Group

        if (finalMtlPath) {
          const mtlModule = await import("three/examples/jsm/loaders/MTLLoader.js")
          const MTLLoader = mtlModule.MTLLoader
          const mtlLoader = new MTLLoader()
          const materials = await mtlLoader.loadAsync(finalMtlPath)
          materials.preload()

          const objLoader = new OBJLoader()
          objLoader.setMaterials(materials)

          object = await objLoader.loadAsync(finalObjPath)
        }
        // Load with texture if texture path is provided but no MTL
        else if (texturePath && !finalMtlPath) {
          const texture = await new THREE.TextureLoader().loadAsync(texturePath)
          const material = new THREE.MeshStandardMaterial({ map: texture })

          const objLoader = new OBJLoader()
          object = await objLoader.loadAsync(finalObjPath)

          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = material
            }
          })
        }
        // Just load the OBJ without materials or textures
        else {
          const objLoader = new OBJLoader()
          object = await objLoader.loadAsync(finalObjPath)
        }

        // Make sure groupRef.current exists before using it
        if (groupRef.current) {
          // Clear previous model if any
          while (groupRef.current.children.length > 0) {
            groupRef.current.remove(groupRef.current.children[0])
          }

          // Add the new model to our group
          groupRef.current.add(object)

          // Apply transformations
          object.position.set(position[0], position[1], position[2])
          object.rotation.set(rotation[0], rotation[1], rotation[2])
          object.scale.set(scale[0], scale[1], scale[2])
        }
      } catch (error) {
        console.error("Error loading 3D model:", error)
      }
    }

    loadModel()

    // Cleanup function
    return () => {
      if (currentGroup) {
        while (currentGroup.children.length > 0) {
          const object = currentGroup.children[0]
          object.traverse((child) => {
            if ((child as THREE.Mesh).material) {
              const mesh = child as THREE.Mesh
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => material.dispose())
              } else {
                mesh.material.dispose()
              }
            }
            if ((child as THREE.Mesh).geometry) {
              ;(child as THREE.Mesh).geometry.dispose()
            }
          })
          currentGroup.remove(object)
        }
      }
    }
  }, [finalObjPath, finalMtlPath, texturePath, position, rotation, scale])

  return <group ref={groupRef} />
}

export default OBJModel
