"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

interface RubiksCubeProps {
  selectedFace: string | null
  selectedCubie: number | null
  rotatingFace: string | null
  rotationDirection: string
  onCubieClick: (face: string, index: number) => void
  onRotationComplete: () => void
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

export default function RubiksCube({
  selectedFace,
  selectedCubie,
  rotatingFace,
  rotationDirection,
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
  const cubiesRef = useRef<THREE.Mesh[][]>([])
  const rotationGroupRef = useRef<THREE.Group | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const rotationProgressRef = useRef<number>(0)

  // State to track the current colors of each cubie on each face
  const [cubeState, setCubeState] = useState(() => {
    const initialState: Record<string, number[]> = {}
    Object.keys(FACE_COLORS).forEach((face) => {
      initialState[face] = Array(9).fill(FACE_COLORS[face as keyof typeof FACE_COLORS])
    })
    return initialState
  })

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(5, 5, 5)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
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
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return

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
          // Determine which cubie on the face was clicked
          const cubieIndex = getCubieIndexOnFace(clickedFace, intersectedCubie)
          if (cubieIndex !== null) {
            onCubieClick(clickedFace, cubieIndex)
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
      if (rotatingFace && rotationGroupRef.current) {
        const rotationSpeed = 0.05
        const targetRotation = (Math.PI / 2) * (rotationDirection === "clockwise" ? 1 : -1)

        rotationProgressRef.current += rotationSpeed

        if (rotationProgressRef.current >= 1) {
          // Rotation complete
          rotationProgressRef.current = 0

          // Move cubies from rotation group back to cube group
          while (rotationGroupRef.current.children.length > 0) {
            const cubie = rotationGroupRef.current.children[0]
            rotationGroupRef.current.remove(cubie)
            cubeRef.current?.add(cubie)
          }

          onRotationComplete()
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

  // Handle face rotation
  useEffect(() => {
    if (!rotatingFace || !cubeRef.current || !rotationGroupRef.current) return

    // Reset rotation group
    rotationGroupRef.current.rotation.set(0, 0, 0)

    // Move cubies from cube group to rotation group based on the face
    const axis = FACE_NORMALS[rotatingFace as keyof typeof FACE_NORMALS]
    const cubies: THREE.Object3D[] = []

    cubeRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const position = new THREE.Vector3()
        child.getWorldPosition(position)

        // Check if the cubie is on the rotating face
        // We use a small threshold to account for floating point errors
        const threshold = 0.1
        let isOnFace = false

        if (rotatingFace === "front" && Math.abs(position.z - 1) < threshold) isOnFace = true
        else if (rotatingFace === "back" && Math.abs(position.z + 1) < threshold) isOnFace = true
        else if (rotatingFace === "up" && Math.abs(position.y - 1) < threshold) isOnFace = true
        else if (rotatingFace === "down" && Math.abs(position.y + 1) < threshold) isOnFace = true
        else if (rotatingFace === "left" && Math.abs(position.x + 1) < threshold) isOnFace = true
        else if (rotatingFace === "right" && Math.abs(position.x - 1) < threshold) isOnFace = true

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

  // Update cubie colors when selected face and cubie change
  useEffect(() => {
    if (selectedFace && selectedCubie !== null && cubeRef.current) {
      // This would be where we update the color of the selected cubie
      // In a real implementation, we would need to track the state of each cubie
    }
  }, [selectedFace, selectedCubie, cubeState])

  // Create the cubies for the Rubik's Cube
  const createCubies = () => {
    if (!cubeRef.current) return

    // Clear existing cubies
    while (cubeRef.current.children.length > 0) {
      cubeRef.current.remove(cubeRef.current.children[0])
    }

    // Initialize cubies array
    const cubies: THREE.Mesh[][] = []
    Object.keys(FACE_COLORS).forEach(() => {
      cubies.push([])
    })
    cubiesRef.current = cubies

    // Create 27 cubies (3x3x3)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Create cubie
          const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95)
          const materials: THREE.MeshLambertMaterial[] = []

          // Define materials for each face
          const faceColors = [
            x === 1 ? FACE_COLORS.right : 0x333333, // Right face
            x === -1 ? FACE_COLORS.left : 0x333333, // Left face
            y === 1 ? FACE_COLORS.up : 0x333333, // Up face
            y === -1 ? FACE_COLORS.down : 0x333333, // Down face
            z === 1 ? FACE_COLORS.front : 0x333333, // Front face
            z === -1 ? FACE_COLORS.back : 0x333333, // Back face
          ]

          // Create materials
          faceColors.forEach((color) => {
            materials.push(new THREE.MeshLambertMaterial({ color }))
          })

          // Create cubie mesh
          const cubie = new THREE.Mesh(geometry, materials)
          cubie.position.set(x, y, z)
          cubie.userData = { x, y, z }
          cubeRef.current?.add(cubie)

          // Add center letters
          addCenterLetters(cubie, x, y, z)

          // Store cubie in array for each face it belongs to
          if (x === 1) cubies[0].push(cubie) // Right face
          if (x === -1) cubies[1].push(cubie) // Left face
          if (y === 1) cubies[2].push(cubie) // Up face
          if (y === -1) cubies[3].push(cubie) // Down face
          if (z === 1) cubies[4].push(cubie) // Front face
          if (z === -1) cubies[5].push(cubie) // Back face
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
        letterMesh.position.copy(direction.multiplyScalar(0.48))
        letterMesh.lookAt(direction.multiplyScalar(2))

        cubie.add(letterMesh)
      }
    }
  }

  // Get the index of a cubie on a specific face
  const getCubieIndexOnFace = (face: string, cubie: THREE.Mesh): number | null => {
    const position = new THREE.Vector3()
    cubie.getWorldPosition(position)

    // Determine the index based on the face and position
    let x = 0,
      y = 0

    switch (face) {
      case "front":
      case "back":
        x = Math.round(position.x) + 1
        y = Math.round(position.y) + 1
        break
      case "up":
      case "down":
        x = Math.round(position.x) + 1
        y = Math.round(position.z) + 1
        break
      case "left":
      case "right":
        x = Math.round(position.z) + 1
        y = Math.round(position.y) + 1
        break
    }

    // Convert 2D coordinates to 1D index (0-8)
    // We need to flip some coordinates based on the face
    if (face === "back" || face === "down" || face === "left") {
      x = 2 - x
    }

    if (face === "back") {
      y = 2 - y
    }

    // Ensure x and y are in range [0, 2]
    if (x < 0 || x > 2 || y < 0 || y > 2) return null

    return y * 3 + x
  }

  return <div ref={containerRef} className="w-full h-full" />
}

