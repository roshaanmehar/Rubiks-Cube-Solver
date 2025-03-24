"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

interface RubiksCubeProps {
  selectedFace: string | null
  selectedCubie: number | null
  rotatingFace: string | null
  rotationDirection: string
  cubeState: Record<string, number[]>
  onCubieClick: (face: string, index: number) => void
  onRotationComplete: (newState: Record<string, number[]>) => void
}

// Define the colors for each face
const FACE_COLORS = {
  front: 0xff0000, // Red
  back: 0xff8000, // Orange
  up: 0xffffff, // White
  down: 0xffff00, // Yellow
  left: 0x00ff00, // Green
  right: 0x0000ff, // Blue
}

// Define the letters for each face (first letter of color)
const FACE_LETTERS = {
  front: "R", // Red
  back: "O", // Orange
  up: "W", // White
  down: "Y", // Yellow
  left: "G", // Green
  right: "B", // Blue
}

// Define the face normals
const FACE_NORMALS = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  up: new THREE.Vector3(0, 1, 0),
  down: new THREE.Vector3(0, -1, 0),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
}

// Define the rotation axes for each face
const ROTATION_AXES = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  up: new THREE.Vector3(0, 1, 0),
  down: new THREE.Vector3(0, -1, 0),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
}

// Map from face to axis and coordinate
const FACE_TO_AXIS = {
  front: { axis: "z", value: 1 },
  back: { axis: "z", value: -1 },
  up: { axis: "y", value: 1 },
  down: { axis: "y", value: -1 },
  left: { axis: "x", value: -1 },
  right: { axis: "x", value: 1 },
}

export default function RubiksCube({
  selectedFace,
  selectedCubie,
  rotatingFace,
  rotationDirection,
  cubeState,
  onCubieClick,
  onRotationComplete,
}: RubiksCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cubeRef = useRef<THREE.Group | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const cubiesRef = useRef<THREE.Mesh[]>([])
  const rotationGroupRef = useRef<THREE.Group | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const rotationProgressRef = useRef<number>(0)
  const isRotatingRef = useRef<boolean>(false)
  const cubiePositionsRef = useRef<Map<THREE.Mesh, THREE.Vector3>>(new Map())
  const cubieToFaceIndicesRef = useRef<Map<THREE.Mesh, Record<string, number>>>(new Map())

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(6, 5, 7)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 5
    controls.maxDistance = 15
    controlsRef.current = controls

    // Create cube group
    const cubeGroup = new THREE.Group()
    scene.add(cubeGroup)
    cubeRef.current = cubeGroup

    // Create rotation group
    const rotationGroup = new THREE.Group()
    scene.add(rotationGroup)
    rotationGroupRef.current = rotationGroup

    // Create cubies
    createCubies()

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Handle mouse click
    const handleMouseClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current || isRotatingRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

      // Get all cubies from the cube group
      const cubies: THREE.Mesh[] = []
      cubeRef.current?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          cubies.push(child)
        }
      })

      const intersects = raycasterRef.current.intersectObjects(cubies)

      if (intersects.length > 0) {
        const intersectedCubie = intersects[0].object as THREE.Mesh
        const faceIndex = Math.floor(intersects[0].faceIndex! / 2)
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersectedCubie.matrixWorld)
        const faceNormal = intersects[0].face!.normal.clone().applyMatrix3(normalMatrix).normalize()

        // Determine which face was clicked
        let clickedFace: string | null = null
        let minAngle = Number.POSITIVE_INFINITY

        Object.entries(FACE_NORMALS).forEach(([face, normal]) => {
          const angle = faceNormal.angleTo(normal)
          if (angle < minAngle) {
            minAngle = angle
            clickedFace = face
          }
        })

        if (clickedFace) {
          // Get the cubie's face indices
          const faceIndices = cubieToFaceIndicesRef.current.get(intersectedCubie)
          if (faceIndices && faceIndices[clickedFace] !== undefined) {
            onCubieClick(clickedFace, faceIndices[clickedFace])
          }
        }
      }
    }

    containerRef.current.addEventListener("click", handleMouseClick)

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      // Handle face rotation animation
      if (rotatingFace && rotationGroupRef.current && isRotatingRef.current) {
        const rotationSpeed = 0.05
        const targetRotation = (Math.PI / 2) * (rotationDirection === "clockwise" ? 1 : -1)

        rotationProgressRef.current += rotationSpeed

        if (rotationProgressRef.current >= 1) {
          // Rotation complete
          rotationProgressRef.current = 0
          isRotatingRef.current = false

          // Update the cube state based on the rotation
          const newState = updateCubeStateAfterRotation(rotatingFace, rotationDirection === "clockwise")

          // Move cubies from rotation group back to cube group
          while (rotationGroupRef.current.children.length > 0) {
            const cubie = rotationGroupRef.current.children[0]
            rotationGroupRef.current.remove(cubie)
            cubeRef.current?.add(cubie)
          }

          // Update the cubie positions map
          updateCubiePositions()

          // Update the cubie to face indices map
          updateCubieToFaceIndices()

          // Notify parent component of rotation completion
          onRotationComplete(newState)
        } else {
          // Continue rotation
          const axis = ROTATION_AXES[rotatingFace as keyof typeof ROTATION_AXES]
          rotationGroupRef.current.setRotationFromAxisAngle(axis, targetRotation * rotationProgressRef.current)
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      containerRef.current?.removeEventListener("click", handleMouseClick)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [onCubieClick, onRotationComplete])

  // Update cubies when cube state changes
  useEffect(() => {
    updateCubieColors()
  }, [cubeState])

  // Handle face rotation
  useEffect(() => {
    if (!rotatingFace || !cubeRef.current || !rotationGroupRef.current) return

    // Reset rotation group
    rotationGroupRef.current.rotation.set(0, 0, 0)
    rotationProgressRef.current = 0
    isRotatingRef.current = true

    // Move cubies from cube group to rotation group based on the face
    const faceInfo = FACE_TO_AXIS[rotatingFace as keyof typeof FACE_TO_AXIS]
    const cubies: THREE.Object3D[] = []

    cubeRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const position = new THREE.Vector3()
        child.getWorldPosition(position)

        // Check if the cubie is on the rotating face
        // We use a small threshold to account for floating point errors
        const threshold = 0.1
        let isOnFace = false

        if (faceInfo.axis === "x" && Math.abs(position.x - faceInfo.value) < threshold) isOnFace = true
        else if (faceInfo.axis === "y" && Math.abs(position.y - faceInfo.value) < threshold) isOnFace = true
        else if (faceInfo.axis === "z" && Math.abs(position.z - faceInfo.value) < threshold) isOnFace = true

        if (isOnFace) {
          cubies.push(child)
        }
      }
    })

    // Move cubies to rotation group
    cubies.forEach((cubie) => {
      cubeRef.current?.remove(cubie)
      rotationGroupRef.current?.add(cubie)
    })
  }, [rotatingFace, rotationDirection])

  // Create the cubies for the Rubik's Cube
  const createCubies = () => {
    if (!cubeRef.current) return

    // Clear existing cubies
    while (cubeRef.current.children.length > 0) {
      cubeRef.current.remove(cubeRef.current.children[0])
    }

    // Clear references
    cubiesRef.current = []
    cubiePositionsRef.current.clear()
    cubieToFaceIndicesRef.current.clear()

    // Create 27 cubies (3x3x3)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Create cubie
          const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95)
          const materials: THREE.MeshStandardMaterial[] = []

          // Define materials for each face with default color for inner faces
          const defaultColor = 0x333333

          // Right face (x = 1)
          materials.push(
            new THREE.MeshStandardMaterial({
              color: x === 1 ? cubeState.right[getCubieIndexOnFace("right", x, y, z)] : defaultColor,
              roughness: 0.3,
              metalness: 0.2,
            }),
          )

          // Left face (x = -1)
          materials.push(
            new THREE.MeshStandardMaterial({
              color: x === -1 ? cubeState.left[getCubieIndexOnFace("left", x, y, z)] : defaultColor,
              roughness: 0.3,
              metalness: 0.2,
            }),
          )

          // Up face (y = 1)
          materials.push(
            new THREE.MeshStandardMaterial({
              color: y === 1 ? cubeState.up[getCubieIndexOnFace("up", x, y, z)] : defaultColor,
              roughness: 0.3,
              metalness: 0.2,
            }),
          )

          // Down face (y = -1)
          materials.push(
            new THREE.MeshStandardMaterial({
              color: y === -1 ? cubeState.down[getCubieIndexOnFace("down", x, y, z)] : defaultColor,
              roughness: 0.3,
              metalness: 0.2,
            }),
          )

          // Front face (z = 1)
          materials.push(
            new THREE.MeshStandardMaterial({
              color: z === 1 ? cubeState.front[getCubieIndexOnFace("front", x, y, z)] : defaultColor,
              roughness: 0.3,
              metalness: 0.2,
            }),
          )

          // Back face (z = -1)
          materials.push(
            new THREE.MeshStandardMaterial({
              color: z === -1 ? cubeState.back[getCubieIndexOnFace("back", x, y, z)] : defaultColor,
              roughness: 0.3,
              metalness: 0.2,
            }),
          )

          // Create cubie mesh
          const cubie = new THREE.Mesh(geometry, materials)
          cubie.position.set(x, y, z)
          cubie.castShadow = true
          cubie.receiveShadow = true
          cubie.userData = { x, y, z }
          cubeRef.current?.add(cubie)
          cubiesRef.current.push(cubie)

          // Store cubie position
          cubiePositionsRef.current.set(cubie, new THREE.Vector3(x, y, z))

          // Store cubie to face indices mapping
          const faceIndices: Record<string, number> = {}
          if (x === 1) faceIndices.right = getCubieIndexOnFace("right", x, y, z)
          if (x === -1) faceIndices.left = getCubieIndexOnFace("left", x, y, z)
          if (y === 1) faceIndices.up = getCubieIndexOnFace("up", x, y, z)
          if (y === -1) faceIndices.down = getCubieIndexOnFace("down", x, y, z)
          if (z === 1) faceIndices.front = getCubieIndexOnFace("front", x, y, z)
          if (z === -1) faceIndices.back = getCubieIndexOnFace("back", x, y, z)
          cubieToFaceIndicesRef.current.set(cubie, faceIndices)

          // Add center letters
          addCenterLetters(cubie, x, y, z)
        }
      }
    }
  }

  // Add center letters to the center cubies
  const addCenterLetters = (cubie: THREE.Mesh, x: number, y: number, z: number) => {
    // Only add letters to center cubies of each face
    if (Math.abs(x) + Math.abs(y) + Math.abs(z) !== 1) return

    let face: keyof typeof FACE_LETTERS | null = null
    let direction: THREE.Vector3 | null = null

    if (x === 1) {
      face = "right"
      direction = new THREE.Vector3(1, 0, 0)
    } else if (x === -1) {
      face = "left"
      direction = new THREE.Vector3(-1, 0, 0)
    } else if (y === 1) {
      face = "up"
      direction = new THREE.Vector3(0, 1, 0)
    } else if (y === -1) {
      face = "down"
      direction = new THREE.Vector3(0, -1, 0)
    } else if (z === 1) {
      face = "front"
      direction = new THREE.Vector3(0, 0, 1)
    } else if (z === -1) {
      face = "back"
      direction = new THREE.Vector3(0, 0, -1)
    }

    if (face && direction) {
      const letter = FACE_LETTERS[face]

      // Create canvas for the letter
      const canvas = document.createElement("canvas")
      canvas.width = 128
      canvas.height = 128
      const context = canvas.getContext("2d")

      if (context) {
        context.fillStyle = "#000000"
        context.font = "bold 80px Arial"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(letter, 64, 64)

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas)

        // Create letter mesh
        const letterGeometry = new THREE.PlaneGeometry(0.5, 0.5)
        const letterMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        })

        const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial)

        // Position the letter slightly in front of the cubie face
        letterMesh.position.copy(direction.clone().multiplyScalar(0.48))
        letterMesh.lookAt(direction.clone().multiplyScalar(2))

        cubie.add(letterMesh)
      }
    }
  }

  // Get the index of a cubie on a specific face
  const getCubieIndexOnFace = (face: string, x: number, y: number, z: number): number => {
    let row = 0,
      col = 0

    switch (face) {
      case "front": // z = 1
        row = 1 - y // 0, 1, 2 from top to bottom
        col = x + 1 // 0, 1, 2 from left to right
        break
      case "back": // z = -1
        row = 1 - y // 0, 1, 2 from top to bottom
        col = 1 - x // 0, 1, 2 from right to left (mirrored)
        break
      case "up": // y = 1
        row = 1 - z // 0, 1, 2 from front to back
        col = x + 1 // 0, 1, 2 from left to right
        break
      case "down": // y = -1
        row = z + 1 // 0, 1, 2 from back to front
        col = x + 1 // 0, 1, 2 from left to right
        break
      case "left": // x = -1
        row = 1 - y // 0, 1, 2 from top to bottom
        col = z + 1 // 0, 1, 2 from back to front
        break
      case "right": // x = 1
        row = 1 - y // 0, 1, 2 from top to bottom
        col = 1 - z // 0, 1, 2 from front to back (mirrored)
        break
    }

    // Convert 2D coordinates to 1D index (0-8)
    return row * 3 + col
  }

  // Update the colors of all cubies based on the cube state
  const updateCubieColors = () => {
    if (!cubeRef.current) return

    cubeRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && Array.isArray(child.material)) {
        const position = new THREE.Vector3()
        child.getWorldPosition(position)

        // Round the position to account for floating point errors
        const x = Math.round(position.x)
        const y = Math.round(position.y)
        const z = Math.round(position.z)

        // Update the materials based on the cube state
        const materials = child.material as THREE.MeshStandardMaterial[]

        // Only update colors for faces that are on the outside of the cube
        if (x === 1 && materials[0] && materials[0].color) {
          materials[0].color.setHex(cubeState.right[getCubieIndexOnFace("right", x, y, z)])
        }
        if (x === -1 && materials[1] && materials[1].color) {
          materials[1].color.setHex(cubeState.left[getCubieIndexOnFace("left", x, y, z)])
        }
        if (y === 1 && materials[2] && materials[2].color) {
          materials[2].color.setHex(cubeState.up[getCubieIndexOnFace("up", x, y, z)])
        }
        if (y === -1 && materials[3] && materials[3].color) {
          materials[3].color.setHex(cubeState.down[getCubieIndexOnFace("down", x, y, z)])
        }
        if (z === 1 && materials[4] && materials[4].color) {
          materials[4].color.setHex(cubeState.front[getCubieIndexOnFace("front", x, y, z)])
        }
        if (z === -1 && materials[5] && materials[5].color) {
          materials[5].color.setHex(cubeState.back[getCubieIndexOnFace("back", x, y, z)])
        }
      }
    })
  }

  // Update the positions of all cubies in the reference map
  const updateCubiePositions = () => {
    cubiePositionsRef.current.clear()

    if (!cubeRef.current) return

    cubeRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const position = new THREE.Vector3()
        child.getWorldPosition(position)

        // Round the position to account for floating point errors
        position.x = Math.round(position.x)
        position.y = Math.round(position.y)
        position.z = Math.round(position.z)

        cubiePositionsRef.current.set(child, position)
      }
    })
  }

  // Update the mapping from cubies to face indices
  const updateCubieToFaceIndices = () => {
    cubieToFaceIndicesRef.current.clear()

    if (!cubeRef.current) return

    cubeRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const position = new THREE.Vector3()
        child.getWorldPosition(position)

        // Round the position to account for floating point errors
        const x = Math.round(position.x)
        const y = Math.round(position.y)
        const z = Math.round(position.z)

        // Store cubie to face indices mapping
        const faceIndices: Record<string, number> = {}
        if (x === 1) faceIndices.right = getCubieIndexOnFace("right", x, y, z)
        if (x === -1) faceIndices.left = getCubieIndexOnFace("left", x, y, z)
        if (y === 1) faceIndices.up = getCubieIndexOnFace("up", x, y, z)
        if (y === -1) faceIndices.down = getCubieIndexOnFace("down", x, y, z)
        if (z === 1) faceIndices.front = getCubieIndexOnFace("front", x, y, z)
        if (z === -1) faceIndices.back = getCubieIndexOnFace("back", x, y, z)

        cubieToFaceIndicesRef.current.set(child, faceIndices)
      }
    })
  }

  // Update the cube state after a rotation
  const updateCubeStateAfterRotation = (face: string, clockwise: boolean): Record<string, number[]> => {
    const newState = { ...cubeState }

    // Helper function to rotate a face
    const rotateFace = (face: string, clockwise: boolean) => {
      const oldFace = [...newState[face]]

      if (clockwise) {
        // Rotate clockwise
        newState[face][0] = oldFace[6]
        newState[face][1] = oldFace[3]
        newState[face][2] = oldFace[0]
        newState[face][3] = oldFace[7]
        newState[face][4] = oldFace[4] // Center stays the same
        newState[face][5] = oldFace[1]
        newState[face][6] = oldFace[8]
        newState[face][7] = oldFace[5]
        newState[face][8] = oldFace[2]
      } else {
        // Rotate counter-clockwise
        newState[face][0] = oldFace[2]
        newState[face][1] = oldFace[5]
        newState[face][2] = oldFace[8]
        newState[face][3] = oldFace[1]
        newState[face][4] = oldFace[4] // Center stays the same
        newState[face][5] = oldFace[7]
        newState[face][6] = oldFace[0]
        newState[face][7] = oldFace[3]
        newState[face][8] = oldFace[6]
      }
    }

    // Rotate the face itself
    rotateFace(face, clockwise)

    // Rotate the adjacent faces
    // This is the most complex part as we need to update the edges of adjacent faces
    switch (face) {
      case "front":
        {
          const temp = clockwise
            ? [newState.up[6], newState.up[7], newState.up[8]]
            : [newState.right[0], newState.right[3], newState.right[6]]

          if (clockwise) {
            // up -> right -> down -> left -> up
            ;[newState.right[0], newState.right[3], newState.right[6]] = [
              newState.up[8],
              newState.up[7],
              newState.up[6],
            ]
            ;[newState.down[2], newState.down[1], newState.down[0]] = [
              newState.right[6],
              newState.right[3],
              newState.right[0],
            ]
            ;[newState.left[8], newState.left[5], newState.left[2]] = [
              newState.down[0],
              newState.down[1],
              newState.down[2],
            ]
            ;[newState.up[6], newState.up[7], newState.up[8]] = [newState.left[2], newState.left[5], newState.left[8]]
          } else {
            // up -> left -> down -> right -> up
            ;[newState.left[2], newState.left[5], newState.left[8]] = [newState.up[6], newState.up[7], newState.up[8]]
            ;[newState.down[0], newState.down[1], newState.down[2]] = [
              newState.left[8],
              newState.left[5],
              newState.left[2],
            ]
            ;[newState.right[6], newState.right[3], newState.right[0]] = [
              newState.down[2],
              newState.down[1],
              newState.down[0],
            ]
            ;[newState.up[8], newState.up[7], newState.up[6]] = [
              newState.right[0],
              newState.right[3],
              newState.right[6],
            ]
          }
        }
        break

      case "back":
        {
          if (clockwise) {
            // up -> left -> down -> right -> up
            const temp = [newState.up[0], newState.up[1], newState.up[2]]
            ;[newState.left[0], newState.left[3], newState.left[6]] = [newState.up[2], newState.up[1], newState.up[0]]
            ;[newState.down[8], newState.down[7], newState.down[6]] = [
              newState.left[0],
              newState.left[3],
              newState.left[6],
            ]
            ;[newState.right[8], newState.right[5], newState.right[2]] = [
              newState.down[6],
              newState.down[7],
              newState.down[8],
            ]
            ;[newState.up[0], newState.up[1], newState.up[2]] = [
              newState.right[2],
              newState.right[5],
              newState.right[8],
            ]
          } else {
            // up -> right -> down -> left -> up
            const temp = [newState.up[0], newState.up[1], newState.up[2]]
            ;[newState.right[2], newState.right[5], newState.right[8]] = [
              newState.up[0],
              newState.up[1],
              newState.up[2],
            ]
            ;[newState.down[6], newState.down[7], newState.down[8]] = [
              newState.right[8],
              newState.right[5],
              newState.right[2],
            ]
            ;[newState.left[0], newState.left[3], newState.left[6]] = [
              newState.down[8],
              newState.down[7],
              newState.down[6],
            ]
            ;[newState.up[2], newState.up[1], newState.up[0]] = [newState.left[0], newState.left[3], newState.left[6]]
          }
        }
        break

      case "up":
        {
          if (clockwise) {
            // back -> right -> front -> left -> back
            const temp = [newState.back[0], newState.back[1], newState.back[2]]
            ;[newState.right[0], newState.right[1], newState.right[2]] = [
              newState.back[0],
              newState.back[1],
              newState.back[2],
            ]
            ;[newState.front[0], newState.front[1], newState.front[2]] = [
              newState.right[0],
              newState.right[1],
              newState.right[2],
            ]
            ;[newState.left[0], newState.left[1], newState.left[2]] = [
              newState.front[0],
              newState.front[1],
              newState.front[2],
            ]
            ;[newState.back[0], newState.back[1], newState.back[2]] = [
              newState.left[0],
              newState.left[1],
              newState.left[2],
            ]
          } else {
            // back -> left -> front -> right -> back
            const temp = [newState.back[0], newState.back[1], newState.back[2]]
            ;[newState.left[0], newState.left[1], newState.left[2]] = [
              newState.back[0],
              newState.back[1],
              newState.back[2],
            ]
            ;[newState.front[0], newState.front[1], newState.front[2]] = [
              newState.left[0],
              newState.left[1],
              newState.left[2],
            ]
            ;[newState.right[0], newState.right[1], newState.right[2]] = [
              newState.front[0],
              newState.front[1],
              newState.front[2],
            ]
            ;[newState.back[0], newState.back[1], newState.back[2]] = [
              newState.right[0],
              newState.right[1],
              newState.right[2],
            ]
            ;[newState.left[0], newState.left[1], newState.left[2]] = [
              newState.back[0],
              newState.back[1],
              newState.back[2],
            ]
          }
        }
        break

      case "down":
        {
          if (clockwise) {
            // front -> right -> back -> left -> front
            const temp = [newState.front[6], newState.front[7], newState.front[8]]
            ;[newState.right[6], newState.right[7], newState.right[8]] = [
              newState.front[6],
              newState.front[7],
              newState.front[8],
            ]
            ;[newState.back[6], newState.back[7], newState.back[8]] = [
              newState.right[6],
              newState.right[7],
              newState.right[8],
            ]
            ;[newState.left[6], newState.left[7], newState.left[8]] = [
              newState.back[6],
              newState.back[7],
              newState.back[8],
            ]
            ;[newState.front[6], newState.front[7], newState.front[8]] = [
              newState.left[6],
              newState.left[7],
              newState.left[8],
            ]
          } else {
            // front -> left -> back -> right -> front
            const temp = [newState.front[6], newState.front[7], newState.front[8]]
            ;[newState.left[6], newState.left[7], newState.left[8]] = [
              newState.front[6],
              newState.front[7],
              newState.front[8],
            ]
            ;[newState.back[6], newState.back[7], newState.back[8]] = [
              newState.left[6],
              newState.left[7],
              newState.left[8],
            ]
            ;[newState.right[6], newState.right[7], newState.right[8]] = [
              newState.back[6],
              newState.back[7],
              newState.back[8],
            ]
            ;[newState.front[6], newState.front[7], newState.front[8]] = [
              newState.right[6],
              newState.right[7],
              newState.right[8],
            ]
          }
        }
        break

      case "left":
        {
          if (clockwise) {
            // up -> back -> down -> front -> up
            const temp = [newState.up[0], newState.up[3], newState.up[6]]
            ;[newState.back[8], newState.back[5], newState.back[2]] = [newState.up[0], newState.up[3], newState.up[6]]
            ;[newState.down[0], newState.down[3], newState.down[6]] = [
              newState.back[8],
              newState.back[5],
              newState.back[2],
            ]
            ;[newState.front[0], newState.front[3], newState.front[6]] = [
              newState.down[0],
              newState.down[3],
              newState.down[6],
            ]
            ;[newState.up[0], newState.up[3], newState.up[6]] = [
              newState.front[0],
              newState.front[3],
              newState.front[6],
            ]
          } else {
            // up -> front -> down -> back -> up
            const temp = [newState.up[0], newState.up[3], newState.up[6]]
            ;[newState.front[0], newState.front[3], newState.front[6]] = [
              newState.up[0],
              newState.up[3],
              newState.up[6],
            ]
            ;[newState.down[0], newState.down[3], newState.down[6]] = [
              newState.front[0],
              newState.front[3],
              newState.front[6],
            ]
            ;[newState.back[8], newState.back[5], newState.back[2]] = [
              newState.down[0],
              newState.down[3],
              newState.down[6],
            ]
            ;[newState.up[0], newState.up[3], newState.up[6]] = [newState.back[8], newState.back[5], newState.back[2]]
          }
        }
        break

      case "right":
        {
          if (clockwise) {
            // up -> front -> down -> back -> up
            const temp = [newState.up[8], newState.up[5], newState.up[2]]
            ;[newState.front[8], newState.front[5], newState.front[2]] = [
              newState.up[8],
              newState.up[5],
              newState.up[2],
            ]
            ;[newState.down[8], newState.down[5], newState.down[2]] = [
              newState.front[8],
              newState.front[5],
              newState.front[2],
            ]
            ;[newState.back[0], newState.back[3], newState.back[6]] = [
              newState.down[8],
              newState.down[5],
              newState.down[2],
            ]
            ;[newState.up[8], newState.up[5], newState.up[2]] = [newState.back[0], newState.back[3], newState.back[6]]
          } else {
            // up -> back -> down -> front -> up
            const temp = [newState.up[8], newState.up[5], newState.up[2]]
            ;[newState.back[0], newState.back[3], newState.back[6]] = [newState.up[8], newState.up[5], newState.up[2]]
            ;[newState.down[8], newState.down[5], newState.down[2]] = [
              newState.back[0],
              newState.back[3],
              newState.back[6],
            ]
            ;[newState.front[8], newState.front[5], newState.front[2]] = [
              newState.down[8],
              newState.down[5],
              newState.down[2],
            ]
            ;[newState.up[8], newState.up[5], newState.up[2]] = [
              newState.front[8],
              newState.front[5],
              newState.front[2],
            ]
          }
        }
        break
    }

    return newState
  }

  return <div ref={containerRef} className="w-full h-full" />
}

