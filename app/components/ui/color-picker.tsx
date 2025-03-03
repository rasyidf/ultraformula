"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-8 h-8 rounded-md border border-input overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          style={{ backgroundColor: color }}
          aria-label="Pick a color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <HexColorPicker color={color} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}
