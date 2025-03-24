"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ColorPickerProps {
  onColorSelect: (color: number) => void
}

const COLORS = [
  { name: "Red", hex: "#FF0000", value: 0xff0000 },
  { name: "Orange", hex: "#FF8000", value: 0xff8000 },
  { name: "White", hex: "#FFFFFF", value: 0xffffff },
  { name: "Yellow", hex: "#FFFF00", value: 0xffff00 },
  { name: "Green", hex: "#00FF00", value: 0x00ff00 },
  { name: "Blue", hex: "#0000FF", value: 0x0000ff },
  { name: "Purple", hex: "#8000FF", value: 0x8000ff },
  { name: "Pink", hex: "#FF00FF", value: 0xff00ff },
  { name: "Black", hex: "#000000", value: 0x000000 },
]

export default function ColorPicker({ onColorSelect }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<number | null>(null)

  const handleColorSelect = (colorValue: number) => {
    setSelectedColor(colorValue)
    onColorSelect(colorValue)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {COLORS.map((color) => (
        <Button
          key={color.name}
          variant="outline"
          className="h-10 w-full p-0 overflow-hidden"
          onClick={() => handleColorSelect(color.value)}
          style={{
            backgroundColor: color.hex,
            border: selectedColor === color.value ? "2px solid black" : "1px solid #e2e8f0",
          }}
        >
          <span className="sr-only">{color.name}</span>
        </Button>
      ))}
    </div>
  )
}

