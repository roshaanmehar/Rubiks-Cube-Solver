"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import RubiksCube from "@/components/rubiks-cube"
import CubeFaceEditor from "@/components/cube-face-editor"

// Standard Rubik's Cube colors
const STANDARD_COLORS = {
  front: 0xff0000, // Red
  back: 0xffa500, // Orange
  up: 0xffffff, // White
  down: 0xffff00, // Yellow
  left: 0x00ff00, // Green
  right: 0x0000ff, // Blue
}

export default function Home() {
  const [selectedFace, setSelectedFace] = useState<string | null>(null)
  const [rotatingFace, setRotatingFace] = useState<string | null>(null)
  const [rotationDirection, setRotationDirection] = useState<string>("clockwise")
  const [cubeKey, setCubeKey] = useState<number>(0) // Force re-render when needed

  // Store the cube state in the parent component to persist changes
  const [cubeState, setCubeState] = useState<Record<string, number[]>>({
    front: Array(9).fill(STANDARD_COLORS.front), // Red
    back: Array(9).fill(STANDARD_COLORS.back), // Orange
    up: Array(9).fill(STANDARD_COLORS.up), // White
    down: Array(9).fill(STANDARD_COLORS.down), // Yellow
    left: Array(9).fill(STANDARD_COLORS.left), // Green
    right: Array(9).fill(STANDARD_COLORS.right), // Blue
  })

  // Handle color selection on the 2D face
  const handleFaceColorChange = (face: string, index: number, color: number) => {
    // Don't allow changing center cubies (index 4 is the center)
    if (index === 4) return

    const newState = { ...cubeState }
    newState[face][index] = color
    setCubeState(newState)
    setCubeKey((prev) => prev + 1) // Force re-render
  }

  // Handle rotation completion
  const handleRotationComplete = (newState: Record<string, number[]>) => {
    setCubeState(newState)
    setRotatingFace(null)
    setCubeKey((prev) => prev + 1) // Force re-render
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gray-50">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex flex-col">
        <h1 className="text-3xl font-bold mb-8 text-center">Rubik's Cube Visualizer</h1>

        <div className="flex flex-col md:flex-row w-full gap-8">
          <div className="w-full md:w-2/3 h-[400px] md:h-[600px] bg-gray-100 rounded-lg shadow-md overflow-hidden">
            <RubiksCube
              key={cubeKey}
              selectedFace={selectedFace}
              rotatingFace={rotatingFace}
              rotationDirection={rotationDirection}
              cubeState={cubeState}
              onCubieClick={(face) => {
                setSelectedFace(face)
              }}
              onRotationComplete={handleRotationComplete}
            />
          </div>

          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>

              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Select Face to Edit</h3>
                <Select onValueChange={(value) => setSelectedFace(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a face" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">Front (Red)</SelectItem>
                    <SelectItem value="back">Back (Orange)</SelectItem>
                    <SelectItem value="up">Up (White)</SelectItem>
                    <SelectItem value="down">Down (Yellow)</SelectItem>
                    <SelectItem value="left">Left (Green)</SelectItem>
                    <SelectItem value="right">Right (Blue)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedFace && (
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Edit Face Colors</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Click on a square to change its color. Center squares cannot be changed.
                  </p>
                  <CubeFaceEditor
                    face={selectedFace}
                    colors={cubeState[selectedFace]}
                    onColorChange={(index, color) => handleFaceColorChange(selectedFace, index, color)}
                  />
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Rotate Face</h3>
                <div className="flex flex-col gap-2">
                  <Select onValueChange={(value) => setRotationDirection(value)} defaultValue="clockwise">
                    <SelectTrigger>
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clockwise">Clockwise</SelectItem>
                      <SelectItem value="counterclockwise">Counter-Clockwise</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button onClick={() => setRotatingFace("front")} disabled={rotatingFace !== null}>
                      Front
                    </Button>
                    <Button onClick={() => setRotatingFace("back")} disabled={rotatingFace !== null}>
                      Back
                    </Button>
                    <Button onClick={() => setRotatingFace("up")} disabled={rotatingFace !== null}>
                      Up
                    </Button>
                    <Button onClick={() => setRotatingFace("down")} disabled={rotatingFace !== null}>
                      Down
                    </Button>
                    <Button onClick={() => setRotatingFace("left")} disabled={rotatingFace !== null}>
                      Left
                    </Button>
                    <Button onClick={() => setRotatingFace("right")} disabled={rotatingFace !== null}>
                      Right
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Instructions</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Click on a face in the 3D view to select it for editing</li>
                <li>Use the 2D face editor to change colors (center squares cannot be changed)</li>
                <li>Use the rotation controls to turn faces</li>
                <li>Drag the cube to rotate the entire view</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

