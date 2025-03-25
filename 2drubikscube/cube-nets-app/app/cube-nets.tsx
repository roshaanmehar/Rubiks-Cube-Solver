"use client"

import { useState, useEffect } from "react"
import { RotateCw, Info, X } from "lucide-react"

export default function CubeNets() {
  // Face arrays for both nets
  const [faceArrays, setFaceArrays] = useState(() => {
    // Try to load from localStorage first
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cubeNetsState")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved state:", e)
        }
      }
    }

    // Default state if nothing in localStorage
    return {
      bW: Array(9).fill("#0000ff"), // Blue (white side)
      oW: Array(9).fill("#ffa500"), // Orange
      rW: Array(9).fill("#ff0000"), // Red
      gW: Array(9).fill("#00ff00"), // Green
      wW: Array(9).fill("#ffffff"), // White, unlinked
      bY: Array(9).fill("#0000ff"), // Blue (yellow side)
      oY: Array(9).fill("#ffa500"), // Orange
      rY: Array(9).fill("#ff0000"), // Red
      gY: Array(9).fill("#00ff00"), // Green
      yY: Array(9).fill("#ffff00"), // Yellow, unlinked
    }
  })

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cubeNetsState", JSON.stringify(faceArrays))
  }, [faceArrays])

  // White net layout
  const whiteLayout = [
    // row0
    [null, null, null, { face: "bW", i: 0 }, { face: "bW", i: 1 }, { face: "bW", i: 2 }, null, null, null],
    // row1
    [null, null, null, { face: "bW", i: 3 }, { face: "bW", i: 4 }, { face: "bW", i: 5 }, null, null, null],
    // row2
    [null, null, null, { face: "bW", i: 6 }, { face: "bW", i: 7 }, { face: "bW", i: 8 }, null, null, null],
    // row3
    [
      { face: "oW", i: 0 },
      { face: "oW", i: 1 },
      { face: "oW", i: 2 },
      { face: "wW", i: 0 },
      { face: "wW", i: 1 },
      { face: "wW", i: 2 },
      { face: "rW", i: 0 },
      { face: "rW", i: 1 },
      { face: "rW", i: 2 },
    ],
    // row4
    [
      { face: "oW", i: 3 },
      { face: "oW", i: 4 },
      { face: "oW", i: 5 },
      { face: "wW", i: 3 },
      { face: "wW", i: 4 },
      { face: "wW", i: 5 },
      { face: "rW", i: 3 },
      { face: "rW", i: 4 },
      { face: "rW", i: 5 },
    ],
    // row5
    [
      { face: "oW", i: 6 },
      { face: "oW", i: 7 },
      { face: "oW", i: 8 },
      { face: "wW", i: 6 },
      { face: "wW", i: 7 },
      { face: "wW", i: 8 },
      { face: "rW", i: 6 },
      { face: "rW", i: 7 },
      { face: "rW", i: 8 },
    ],
    // row6
    [null, null, null, { face: "gW", i: 0 }, { face: "gW", i: 1 }, { face: "gW", i: 2 }, null, null, null],
    // row7
    [null, null, null, { face: "gW", i: 3 }, { face: "gW", i: 4 }, { face: "gW", i: 5 }, null, null, null],
    // row8
    [null, null, null, { face: "gW", i: 6 }, { face: "gW", i: 7 }, { face: "gW", i: 8 }, null, null, null],
  ]

  // Yellow net layout
  const yellowLayout = [
    // row0
    [null, null, null, { face: "gY", i: 8 }, { face: "gY", i: 7 }, { face: "gY", i: 6 }, null, null, null],
    // row1
    [null, null, null, { face: "gY", i: 5 }, { face: "gY", i: 4 }, { face: "gY", i: 3 }, null, null, null],
    // row2
    [null, null, null, { face: "gY", i: 2 }, { face: "gY", i: 1 }, { face: "gY", i: 0 }, null, null, null],
    // row3
    [
      { face: "oY", i: 0 },
      { face: "oY", i: 1 },
      { face: "oY", i: 2 },
      { face: "yY", i: 0 },
      { face: "yY", i: 1 },
      { face: "yY", i: 2 },
      { face: "rY", i: 0 },
      { face: "rY", i: 1 },
      { face: "rY", i: 2 },
    ],
    // row4
    [
      { face: "oY", i: 3 },
      { face: "oY", i: 4 },
      { face: "oY", i: 5 },
      { face: "yY", i: 3 },
      { face: "yY", i: 4 },
      { face: "yY", i: 5 },
      { face: "rY", i: 3 },
      { face: "rY", i: 4 },
      { face: "rY", i: 5 },
    ],
    // row5
    [
      { face: "oY", i: 6 },
      { face: "oY", i: 7 },
      { face: "oY", i: 8 },
      { face: "yY", i: 6 },
      { face: "yY", i: 7 },
      { face: "yY", i: 8 },
      { face: "rY", i: 6 },
      { face: "rY", i: 7 },
      { face: "rY", i: 8 },
    ],
    // row6
    [null, null, null, { face: "bY", i: 8 }, { face: "bY", i: 7 }, { face: "bY", i: 6 }, null, null, null],
    // row7
    [null, null, null, { face: "bY", i: 5 }, { face: "bY", i: 4 }, { face: "bY", i: 3 }, null, null, null],
    // row8
    [null, null, null, { face: "bY", i: 2 }, { face: "bY", i: 1 }, { face: "bY", i: 0 }, null, null, null],
  ]

  // Available colors for cycling
  const availableColors = [
    "#ff0000", // Red
    "#ffa500", // Orange
    "#ffffff", // White
    "#ffff00", // Yellow
    "#00ff00", // Green
    "#0000ff", // Blue
  ]

  // Function to get the next color in the cycle
  const getNextColor = (currentColor) => {
    const index = availableColors.indexOf(currentColor)
    if (index === -1) return availableColors[0]
    return availableColors[(index + 1) % availableColors.length]
  }

  // Function to cycle color on click
  const cycleColor = (faceName, index) => {
    setFaceArrays((prev) => {
      const newArrays = { ...prev }
      const currentColor = newArrays[faceName][index]
      const nextColor = getNextColor(currentColor)

      // Update the color
      newArrays[faceName] = [...newArrays[faceName]]
      newArrays[faceName][index] = nextColor

      // If it's W or Y => do nothing else
      if (faceName === "wW" || faceName === "yY") return newArrays

      // If face is among b/o/r/g => reflect to the other side at index 8 - i
      const faceChar = faceName[0] // b/o/r/g
      const sideChar = faceName[1] // 'W' or 'Y'

      const otherFaceName = faceChar + (sideChar === "W" ? "Y" : "W")
      const otherIndex = 8 - index

      newArrays[otherFaceName] = [...newArrays[otherFaceName]]
      newArrays[otherFaceName][otherIndex] = nextColor

      return newArrays
    })
  }

  // Function to rotate a face
  const rotateFace = (faceName) => {
    setFaceArrays((prev) => {
      const newArrays = { ...prev }

      // Create a copy of the array to rotate
      const arr = [...newArrays[faceName]]
      const old = [...arr]

      // Rotate clockwise
      arr[0] = old[6]
      arr[1] = old[3]
      arr[2] = old[0]
      arr[3] = old[7]
      arr[4] = old[4]
      arr[5] = old[1]
      arr[6] = old[8]
      arr[7] = old[5]
      arr[8] = old[2]

      newArrays[faceName] = arr

      // If the face is shared, rotate the other side as well
      if (faceName === "wW" || faceName === "yY") return newArrays

      const faceChar = faceName[0] // b/o/r/g
      const sideChar = faceName[1] // 'W' or 'Y'

      const otherFaceName = faceChar + (sideChar === "W" ? "Y" : "W")

      // Create a copy of the other array to rotate
      const otherArr = [...newArrays[otherFaceName]]
      const otherOld = [...otherArr]

      // Rotate clockwise
      otherArr[0] = otherOld[6]
      otherArr[1] = otherOld[3]
      otherArr[2] = otherOld[0]
      otherArr[3] = otherOld[7]
      otherArr[4] = otherOld[4]
      otherArr[5] = otherOld[1]
      otherArr[6] = otherOld[8]
      otherArr[7] = otherOld[5]
      otherArr[8] = otherOld[2]

      newArrays[otherFaceName] = otherArr

      return newArrays
    })
  }

  // State for info modal
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="cube-nets-container">
      <header>
        <h1>Two Nets with 180° Reflection for Shared Faces</h1>
        <button className="info-button" onClick={() => setShowInfo(true)} aria-label="Show information">
          <Info size={24} />
        </button>
      </header>

      <div className="nets">
        {/* White-center net */}
        <div className="net-container">
          <h2>White-Center Layout</h2>
          <div className="grid9x9">
            {whiteLayout.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`white-${rowIndex}-${colIndex}`}
                  className={`cell ${!cell ? "empty" : ""} ${cell && cell.i === 4 ? "center" : ""}`}
                  style={cell ? { backgroundColor: faceArrays[cell.face][cell.i] } : {}}
                  onClick={() => (cell && cell.i !== 4 ? cycleColor(cell.face, cell.i) : null)}
                >
                  {cell && cell.i !== 4 && <span className="cell-index">{cell.i}</span>}
                </div>
              )),
            )}
          </div>
        </div>

        {/* Yellow-center net */}
        <div className="net-container">
          <h2>Yellow-Center Layout</h2>
          <div className="grid9x9">
            {yellowLayout.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`yellow-${rowIndex}-${colIndex}`}
                  className={`cell ${!cell ? "empty" : ""} ${cell && cell.i === 4 ? "center" : ""}`}
                  style={cell ? { backgroundColor: faceArrays[cell.face][cell.i] } : {}}
                  onClick={() => (cell && cell.i !== 4 ? cycleColor(cell.face, cell.i) : null)}
                >
                  {cell && cell.i !== 4 && <span className="cell-index">{cell.i}</span>}
                </div>
              )),
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="control-panel">
          <h2>Rotate a Face</h2>
          <p>Rotates the face clockwise. Rotates only that side's 3×3 orientation (no adjacency).</p>

          <div className="rotation-controls">
            <div className="rotation-section">
              <h3>White Net Faces</h3>
              <div className="buttons">
                <button onClick={() => rotateFace("bW")} className="rotate-button blue">
                  <RotateCw size={16} /> B
                </button>
                <button onClick={() => rotateFace("oW")} className="rotate-button orange">
                  <RotateCw size={16} /> O
                </button>
                <button onClick={() => rotateFace("rW")} className="rotate-button red">
                  <RotateCw size={16} /> R
                </button>
                <button onClick={() => rotateFace("gW")} className="rotate-button green">
                  <RotateCw size={16} /> G
                </button>
                <button onClick={() => rotateFace("wW")} className="rotate-button white">
                  <RotateCw size={16} /> W
                </button>
              </div>
            </div>

            <div className="rotation-section">
              <h3>Yellow Net Faces</h3>
              <div className="buttons">
                <button onClick={() => rotateFace("bY")} className="rotate-button blue">
                  <RotateCw size={16} /> B
                </button>
                <button onClick={() => rotateFace("oY")} className="rotate-button orange">
                  <RotateCw size={16} /> O
                </button>
                <button onClick={() => rotateFace("rY")} className="rotate-button red">
                  <RotateCw size={16} /> R
                </button>
                <button onClick={() => rotateFace("gY")} className="rotate-button green">
                  <RotateCw size={16} /> G
                </button>
                <button onClick={() => rotateFace("yY")} className="rotate-button yellow">
                  <RotateCw size={16} /> Y
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="modal">
          <div className="modal-content info-modal">
            <div className="modal-header">
              <h3>How to Use</h3>
              <button className="close-button" onClick={() => setShowInfo(false)} aria-label="Close information">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <ul>
                <li>
                  <strong>Click on any sticker</strong> to cycle through colors (Red → Orange → White → Yellow → Green →
                  Blue)
                </li>
                <li>
                  <strong>Faces B/O/R/G</strong> are <em>shared</em> across both nets. If you recolor index i on one
                  net, index (8−i) on the other net gets that color (180° reflection).
                </li>
                <li>
                  <strong>Faces W and Y</strong> are <em>unlinked</em> (White net only, Yellow net only).
                </li>
                <li>
                  <strong>Rotation buttons</strong> only affect local orientation. B on White can differ from B on
                  Yellow.
                </li>
                <li>
                  Your changes are <strong>automatically saved</strong> and will persist when you refresh the page.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cube-nets-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
        }

        h1 {
          font-size: 2rem;
          color: #212529;
          margin: 0;
        }

        h2 {
          font-size: 1.5rem;
          color: #343a40;
          margin-top: 0;
          margin-bottom: 15px;
        }

        h3 {
          font-size: 1.2rem;
          color: #495057;
          margin-top: 0;
          margin-bottom: 10px;
        }

        .info-button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, color 0.2s;
        }

        .info-button:hover {
          background-color: #e9ecef;
          color: #212529;
        }

        .nets {
          display: flex;
          gap: 40px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .net-container {
          background-color: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }

        .net-container:hover {
          transform: translateY(-5px);
        }

        .grid9x9 {
          display: grid;
          grid-template-columns: repeat(9, 45px);
          grid-template-rows: repeat(9, 45px);
          gap: 2px;
        }

        .cell {
          width: 45px;
          height: 45px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border-radius: 4px;
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }

        .cell:not(.empty):not(.center):hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 1;
        }

        .cell.empty {
          border: none;
          cursor: default;
        }

        .cell.center {
          cursor: default;
          border: 2px solid rgba(0, 0, 0, 0.4);
        }

        .cell-index {
          position: absolute;
          bottom: 2px;
          right: 2px;
          font-size: 10px;
          color: rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }

        .controls {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .control-panel {
          background-color: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          max-width: 800px;
          width: 100%;
        }

        .rotation-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          justify-content: space-around;
        }

        .rotation-section {
          flex: 1;
          min-width: 250px;
        }

        .buttons {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 10px;
        }

        .rotate-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .rotate-button:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        .rotate-button:active {
          transform: translateY(0);
        }

        .rotate-button.blue {
          background-color: #0000ff;
        }

        .rotate-button.orange {
          background-color: #ffa500;
        }

        .rotate-button.red {
          background-color: #ff0000;
        }

        .rotate-button.green {
          background-color: #00ff00;
          color: #212529;
          text-shadow: none;
        }

        .rotate-button.white {
          background-color: #ffffff;
          color: #212529;
          text-shadow: none;
          border: 1px solid #dee2e6;
        }

        .rotate-button.yellow {
          background-color: #ffff00;
          color: #212529;
          text-shadow: none;
        }

        /* Modal */
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s, color 0.2s;
        }

        .close-button:hover {
          background-color: #e9ecef;
          color: #212529;
        }

        .modal-body {
          padding: 20px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .modal-body ul {
          padding-left: 20px;
          line-height: 1.6;
        }

        .modal-body li {
          margin-bottom: 12px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .nets {
            gap: 20px;
          }
          
          .grid9x9 {
            grid-template-columns: repeat(9, 35px);
            grid-template-rows: repeat(9, 35px);
          }
          
          .cell {
            width: 35px;
            height: 35px;
          }
          
          h1 {
            font-size: 1.5rem;
          }
          
          .rotation-controls {
            flex-direction: column;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  )
}

