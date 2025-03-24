"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CubeFaceEditorProps {
  face: string
  colors: number[]
  onColorChange: (index: number, color: number) => void
}

const COLORS = [
  { name: "Red", hex: "#FF0000", value: 0xff0000 },
  { name: "Orange", hex: "#FFA500", value: 0xffa500 },
  { name: "White", hex: "#FFFFFF", value: 0xffffff },
  { name: "Yellow", hex: "#FFFF00", value: 0xffff00 },
  { name: "Green", hex: "#00FF00", value: 0x00ff00 },
  { name: "Blue", hex: "#0000FF", value: 0x0000ff },
]

// Helper function to convert hex number to hex string
const hexToString = (hex: number): string => {
  return "#" + hex.toString(16).padStart(6, "0")
}

export default function CubeFaceEditor({ face, colors, onColorChange }: CubeFaceEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleSquareClick = (index: number) => {
    // Don't allow selecting center square (index 4)
    if (index === 4) return
    setSelectedIndex(index)
  }

  const handleColorSelect = (color: number) => {
    if (selectedIndex !== null) {
      onColorChange(selectedIndex, color)
      setSelectedIndex(null)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-1 w-48 h-48 mb-4">
        {colors.map((color, index) => (
          <div
            key={index}
            className={`
              w-full h-full flex items-center justify-center rounded-sm cursor-pointer border-2
              ${selectedIndex === index ? "border-black" : "border-gray-200"}
              ${index === 4 ? "cursor-not-allowed opacity-80" : "hover:border-gray-400"}
            `}
            style={{ backgroundColor: hexToString(color) }}
            onClick={() => handleSquareClick(index)}
          >
            {index === 4 && (
              <span className="text-xs font-bold text-black bg-white/70 px-1 rounded">
                {face.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <Popover open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="hidden">
              Color Picker
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((color) => (
                <Button
                  key={color.name}
                  variant="outline"
                  className="h-10 w-full p-0 overflow-hidden"
                  onClick={() => handleColorSelect(color.value)}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="sr-only">{color.name}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

