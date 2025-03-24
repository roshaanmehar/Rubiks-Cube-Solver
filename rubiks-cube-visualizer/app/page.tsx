"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import RubiksCube from "@/components/rubiks-cube"
import ColorPicker from "@/components/color-picker"

export default function Home() {
  const [selectedFace, setSelectedFace] = useState<string | null>(null)
  const [selectedCubie, setSelectedCubie] = useState<number | null>(null)
  const [rotatingFace, setRotatingFace] = useState<string | null>(null)
  const [rotationDirection, setRotationDirection] = useState<string>("clockwise")
  const [cubeKey, setCubeKey] = useState<number>(0) // Force re-render when needed

  // Store the cube state in the parent component to persist changes
  const [cubeState, setCubeState] = useState<Record<string, number[]>>({
    front: Array(9).fill(0xff0000), // Red
    back: Array(9).fill(0xff8000), // Orange
    up: Array(9).fill(0xffffff), // White
    down: Array(9).fill(0xffff00), // Yellow
    left: Array(9).fill(0x00ff00), // Green
    right: Array(9).fill(0x0000ff), // Blue
  })

  // Handle color selection
  const handleColorSelect = (color: number) => {
    if (selectedFace && selectedCubie !== null) {
      const newState = { ...cubeState }
      newState[selectedFace][selectedCubie] = color
      setCubeState(newState)
      setCubeKey((prev) => prev + 1) // Force re-render
    }
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
              selectedCubie={selectedCubie}
              rotatingFace={rotatingFace}
              rotationDirection={rotationDirection}
              cubeState={cubeState}
              onCubieClick={(face, index) => {
                setSelectedFace(face)
                setSelectedCubie(index)
              }}
              onRotationComplete={handleRotationComplete}
            />
          </div>

          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>

              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Select Face</h3>
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
                  <h3 className="text-md font-medium mb-2">Select Cubie</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                      <Button
                        key={index}
                        variant={selectedCubie === index ? "default" : "outline"}
                        onClick={() => setSelectedCubie(index)}
                        className="h-10 w-10"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedFace && selectedCubie !== null && (
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Change Color</h3>
                  <ColorPicker
                    selectedColor={
                      selectedFace && selectedCubie !== null ? cubeState[selectedFace][selectedCubie] : null
                    }
                    onColorSelect={handleColorSelect}
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
                <li>Select a face and cubie to change its color</li>
                <li>Use the rotation controls to turn faces</li>
                <li>The letter in the center of each face represents the first letter of its color</li>
                <li>Drag the cube to rotate the entire view</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

