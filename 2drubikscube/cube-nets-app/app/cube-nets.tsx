"use client"

import { useState, useEffect, useRef } from "react"
import { RotateCw, Info, X, Maximize, Minimize, ZoomIn, ZoomOut, ChevronDown, ChevronUp, Check, AlertTriangle, Loader2, Send } from "lucide-react" // Added icons

// Define the mapping from hex colors to lowercase color characters
const hexToColorChar: { [key: string]: string } = {
    "#ff0000": "r", // Red
    "#ffa500": "o", // Orange
    "#ffffff": "w", // White
    "#ffff00": "y", // Yellow
    "#00ff00": "g", // Green
    "#0000ff": "b", // Blue
    // Add fallbacks or handle unknown colors if necessary
};

// Define the standard face order expected by the backend validation input
const faceInputOrder = ['u', 'r', 'f', 'd', 'l', 'b'];
// Define which face array corresponds to which standard face (using White Net as primary)
const faceArrayMapping: { [key: string]: string } = {
    u: "wW", // White face array maps to Up
    r: "rW", // Red face array maps to Right
    f: "gW", // Green face array maps to Front
    d: "yY", // Yellow face array maps to Down (Needs Y net for this)
    l: "oW", // Orange face array maps to Left
    b: "bW", // Blue face array maps to Back
};


export default function CubeNets() {
    // --- Existing State ---
    const [faceArrays, setFaceArrays] = useState({
        bW: Array(9).fill("#0000ff"), oW: Array(9).fill("#ffa500"),
        rW: Array(9).fill("#ff0000"), gW: Array(9).fill("#00ff00"),
        wW: Array(9).fill("#ffffff"), // White (Up)
        bY: Array(9).fill("#0000ff"), oY: Array(9).fill("#ffa500"),
        rY: Array(9).fill("#ff0000"), gY: Array(9).fill("#00ff00"),
        yY: Array(9).fill("#ffff00"), // Yellow (Down)
    })
    const [showInfo, setShowInfo] = useState(false)
    const [whiteNetCollapsed, setWhiteNetCollapsed] = useState(false)
    const [yellowNetCollapsed, setYellowNetCollapsed] = useState(false)
    const [controlsCollapsed, setControlsCollapsed] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(1)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const containerRef = useRef(null)

    // --- New State for API Interaction ---
    const [isLoading, setIsLoading] = useState(false);
    const [solution, setSolution] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [resultPanelCollapsed, setResultPanelCollapsed] = useState(false); // Collapse state for result panel

    // --- Existing useEffect hooks for localStorage and Fullscreen ---
    useEffect(() => {
        // Load from localStorage
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("cubeNetsState")
            if (saved) {
                try {
                    const parsedState = JSON.parse(saved);
                    // Basic validation to ensure structure matches
                    if (typeof parsedState === 'object' && parsedState !== null && faceArrayMapping.d in parsedState) {
                         setFaceArrays(parsedState);
                    } else {
                         console.warn("Saved state structure mismatch, using default.");
                    }
                } catch (e) {
                    console.error("Failed to parse saved state:", e)
                }
            }
        }
    }, [])

    useEffect(() => {
        // Save to localStorage
        if (typeof window !== "undefined") {
            localStorage.setItem("cubeNetsState", JSON.stringify(faceArrays))
        }
    }, [faceArrays])

    useEffect(() => {
        // Fullscreen listener
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
        if (typeof window !== "undefined") {
            document.addEventListener("fullscreenchange", handleFullscreenChange)
            return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
        }
    }, [])


    // --- Existing Layout Definitions ---
    const whiteLayout = [/* ... same as before ... */];
    const yellowLayout = [/* ... same as before ... */];
    const availableColors = [/* ... same as before ... */];

    // --- Existing Event Handlers (getNextColor, cycleColor, rotateFace, toggleFullscreen, zoom etc.) ---
    const getNextColor = (currentColor: string) => { /* ... same as before ... */ };
    const cycleColor = (faceName: string, index: number) => { /* ... same as before ... */ };
    const rotateFace = (faceName: string) => { /* ... same as before ... */ };
    const toggleFullscreen = () => { /* ... same as before ... */ };
    const increaseZoom = () => setZoomLevel((prev) => Math.min(prev + 0.1, 1.5));
    const decreaseZoom = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
    const resetZoom = () => setZoomLevel(1);

    // --- NEW: Function to Convert State for API ---
    const convertStateForApi = (): { [key: string]: string } | null => {
        const apiPayload: { [key: string]: string } = {};
        let conversionError = false;

        for (const faceChar of faceInputOrder) { // 'u', 'r', 'f', 'd', 'l', 'b'
            const faceArrayKey = faceArrayMapping[faceChar]; // e.g., "wW" for 'u'
            const colorArray = faceArrays[faceArrayKey as keyof typeof faceArrays]; // Get the color array (e.g., faceArrays.wW)

            if (!colorArray || colorArray.length !== 9) {
                setError(`Internal Error: Face array for '${faceChar}' (${faceArrayKey}) is missing or invalid.`);
                conversionError = true;
                break;
            }

            let faceString = "";
            for (const hexColor of colorArray) {
                const colorChar = hexToColorChar[hexColor];
                if (!colorChar) {
                    setError(`Error: Unrecognized color '${hexColor}' found on face '${faceChar}' (${faceArrayKey}). Please use standard colors.`);
                    conversionError = true;
                    break;
                }
                faceString += colorChar;
            }
            if (conversionError) break;
            apiPayload[faceChar] = faceString; // Assign "wwwwwwwww" to key 'u', etc.
        }

        return conversionError ? null : apiPayload;
    };


    // --- NEW: Function to Handle Solve Button Click ---
    const handleSolveClick = async () => {
        setIsLoading(true);
        setSolution(null);
        setError(null);
        setResultPanelCollapsed(false); // Ensure result panel is open

        const apiPayload = convertStateForApi();

        if (!apiPayload) {
            setIsLoading(false);
            // Error state already set by convertStateForApi
            return;
        }

        console.log("Sending to backend:", apiPayload);

        try {
            // Make sure the backend URL is correct (use environment variable in real app)
            const response = await fetch('http://localhost:5001/api/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiPayload),
            });

            const result = await response.json();

            if (response.ok) {
                setSolution(result.solution);
                setError(null); // Clear previous errors
                console.log("Solution received:", result.solution);
            } else {
                setError(result.error || `Request failed with status ${response.status}`);
                setSolution(null);
                console.error("API Error:", result.error);
            }
        } catch (err) {
            console.error("Network or fetch error:", err);
            setError(err instanceof Error ? `Network Error: ${err.message}` : "An unknown network error occurred.");
            setSolution(null);
        } finally {
            setIsLoading(false);
        }
    };


    // --- JSX Structure (with added Solve Button and Result Display) ---
    return (
        <div className="cube-nets-container" ref={containerRef}>
            <header>
                {/* ... same header controls (zoom, fullscreen, info) ... */}
            </header>

            <div className="nets">
                 {/* White-center net */}
                 <div className="net-container">
                     {/* ... net header and grid rendering same as before ... */}
                 </div>

                 {/* Yellow-center net */}
                 <div className="net-container">
                      {/* ... net header and grid rendering same as before ... */}
                 </div>
            </div>

             {/* Controls Section */}
            <div className="controls">
                {/* Rotate Controls Panel */}
                 <div className="control-panel">
                      {/* ... rotate panel header and buttons same as before ... */}
                 </div>

                 {/* --- NEW: Solve Panel --- */}
                 <div className="control-panel solve-panel">
                      <div className="panel-header" onClick={() => setResultPanelCollapsed(!resultPanelCollapsed)}>
                           <h2>Solve & Results</h2>
                           <button className="collapse-button">
                               {resultPanelCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                           </button>
                     </div>
                     {!resultPanelCollapsed && (
                         <>
                             <p>Click below to validate the current cube state and find a solution.</p>
                             <button
                                 className="solve-button"
                                 onClick={handleSolveClick}
                                 disabled={isLoading}
                             >
                                 {isLoading ? (
                                     <>
                                         <Loader2 size={18} className="animate-spin" /> Validating & Solving...
                                     </>
                                 ) : (
                                     <>
                                         <Send size={18} /> Validate & Solve Cube
                                     </>
                                 )}
                             </button>

                             {/* --- Result Display Area --- */}
                             <div className="results-area">
                                 {error && (
                                     <div className="result-message error">
                                         <AlertTriangle size={20} />
                                         <div>
                                             <strong>Error:</strong>
                                             <p>{error}</p>
                                         </div>
                                     </div>
                                 )}
                                 {solution && (
                                     <div className="result-message success">
                                         <Check size={20} />
                                         <div>
                                             <strong>Solution Found:</strong>
                                             <p className="solution-text">{solution}</p>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </>
                     )}
                 </div> {/* End Solve Panel */}

            </div> {/* End Controls Section */}


            {/* Info Modal */}
            {showInfo && ( /* ... same as before ... */ )}

            {/* --- Styles --- */}
            <style jsx>{`
                /* --- Include ALL previous styles --- */
                .cube-nets-container { /* ... */ }
                header { /* ... */ }
                h1, h2, h3 { /* ... */ }
                .nets { /* ... */ }
                .net-container { /* ... */ }
                .grid9x9 { /* ... */ }
                .cell { /* ... */ }
                .controls {
                    display: flex; /* Changed to flex */
                    flex-direction: column; /* Stack panels vertically */
                    gap: 20px; /* Add gap between panels */
                    margin-top: 10px;
                    align-items: center; /* Center panels horizontally */
                }
                .control-panel { /* ... width adjustments if needed ... */
                    width: 100%; /* Make panels take full width */
                    max-width: 800px; /* Adjust max-width as needed */
                }
                .rotation-controls { /* ... */ }
                .rotate-button { /* ... */ }
                .modal { /* ... */ }

                /* --- NEW Styles for Solve Button and Results --- */
                 .solve-panel {
                     /* Optional: Add specific styles if needed */
                 }

                .solve-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px 20px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: white;
                    background-color: #007bff; /* Blue */
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background-color 0.2s, opacity 0.2s;
                    margin-top: 10px;
                    width: 100%; /* Make button wider */
                    max-width: 300px; /* Limit max width */
                    margin-left: auto;
                    margin-right: auto;
                    display: block; /* Center block element */
                }

                .solve-button:hover {
                    background-color: #0056b3;
                }

                .solve-button:disabled {
                    background-color: #6c757d; /* Gray when disabled */
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .results-area {
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid #e9ecef;
                }

                .result-message {
                    display: flex;
                    align-items: flex-start; /* Align icon top */
                    gap: 10px;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    word-break: break-word; /* Prevent long strings overflow */
                }

                .result-message.error {
                    background-color: #f8d7da; /* Light red */
                    color: #721c24; /* Dark red */
                    border: 1px solid #f5c6cb;
                }
                 .result-message.error strong { color: #721c24; }
                 .result-message.error p { margin: 5px 0 0 0; }


                .result-message.success {
                    background-color: #d4edda; /* Light green */
                    color: #155724; /* Dark green */
                    border: 1px solid #c3e6cb;
                }
                 .result-message.success strong { color: #155724; }
                 .result-message.success p { margin: 5px 0 0 0; }

                 .solution-text {
                    font-family: var(--font-geist-mono), monospace; /* Monospace for solution */
                    font-size: 0.95rem;
                    background-color: rgba(255, 255, 255, 0.5); /* Slight background */
                    padding: 5px 8px;
                    border-radius: 4px;
                    display: inline-block; /* Fit content */
                    max-width: 100%;
                    overflow-x: auto; /* Allow scrolling for long solutions */
                 }


                 /* --- Responsive Adjustments --- */
                 /* Add or modify existing media queries if needed */
                 @media (max-width: 768px) {
                    .controls {
                        /* Stack panels if needed, or adjust gap */
                    }
                    .solve-button {
                        max-width: 90%;
                    }
                 }

             `}</style>
        </div>
    )
}


// Make sure to include the definitions for these components/functions if they were outside the main export
const whiteLayout = [
    // row0
    [null, null, null, { face: "bW", i: 0 }, { face: "bW", i: 1 }, { face: "bW", i: 2 }, null, null, null],
    // row1
    [null, null, null, { face: "bW", i: 3 }, { face: "bW", i: 4 }, { face: "bW", i: 5 }, null, null, null],
    // row2
    [null, null, null, { face: "bW", i: 6 }, { face: "bW", i: 7 }, { face: "bW", i: 8 }, null, null, null],
    // row3
    [
      { face: "oW", i: 0 }, { face: "oW", i: 1 }, { face: "oW", i: 2 },
      { face: "wW", i: 0 }, { face: "wW", i: 1 }, { face: "wW", i: 2 }, // U face
      { face: "rW", i: 0 }, { face: "rW", i: 1 }, { face: "rW", i: 2 },
    ],
    // row4
    [
      { face: "oW", i: 3 }, { face: "oW", i: 4 }, { face: "oW", i: 5 },
      { face: "wW", i: 3 }, { face: "wW", i: 4 }, { face: "wW", i: 5 }, // U face
      { face: "rW", i: 3 }, { face: "rW", i: 4 }, { face: "rW", i: 5 },
    ],
    // row5
    [
      { face: "oW", i: 6 }, { face: "oW", i: 7 }, { face: "oW", i: 8 },
      { face: "wW", i: 6 }, { face: "wW", i: 7 }, { face: "wW", i: 8 }, // U face
      { face: "rW", i: 6 }, { face: "rW", i: 7 }, { face: "rW", i: 8 },
    ],
    // row6
    [null, null, null, { face: "gW", i: 0 }, { face: "gW", i: 1 }, { face: "gW", i: 2 }, null, null, null],
    // row7
    [null, null, null, { face: "gW", i: 3 }, { face: "gW", i: 4 }, { face: "gW", i: 5 }, null, null, null],
    // row8
    [null, null, null, { face: "gW", i: 6 }, { face: "gW", i: 7 }, { face: "gW", i: 8 }, null, null, null],
  ]

  const yellowLayout = [
    // row0
    [null, null, null, { face: "gY", i: 8 }, { face: "gY", i: 7 }, { face: "gY", i: 6 }, null, null, null],
    // row1
    [null, null, null, { face: "gY", i: 5 }, { face: "gY", i: 4 }, { face: "gY", i: 3 }, null, null, null],
    // row2
    [null, null, null, { face: "gY", i: 2 }, { face: "gY", i: 1 }, { face: "gY", i: 0 }, null, null, null],
    // row3
    [
      { face: "oY", i: 0 }, { face: "oY", i: 1 }, { face: "oY", i: 2 },
      { face: "yY", i: 0 }, { face: "yY", i: 1 }, { face: "yY", i: 2 }, // D face
      { face: "rY", i: 0 }, { face: "rY", i: 1 }, { face: "rY", i: 2 },
    ],
    // row4
    [
      { face: "oY", i: 3 }, { face: "oY", i: 4 }, { face: "oY", i: 5 },
      { face: "yY", i: 3 }, { face: "yY", i: 4 }, { face: "yY", i: 5 }, // D face
      { face: "rY", i: 3 }, { face: "rY", i: 4 }, { face: "rY", i: 5 },
    ],
    // row5
    [
      { face: "oY", i: 6 }, { face: "oY", i: 7 }, { face: "oY", i: 8 },
      { face: "yY", i: 6 }, { face: "yY", i: 7 }, { face: "yY", i: 8 }, // D face
      { face: "rY", i: 6 }, { face: "rY", i: 7 }, { face: "rY", i: 8 },
    ],
    // row6
    [null, null, null, { face: "bY", i: 8 }, { face: "bY", i: 7 }, { face: "bY", i: 6 }, null, null, null],
    // row7
    [null, null, null, { face: "bY", i: 5 }, { face: "bY", i: 4 }, { face: "bY", i: 3 }, null, null, null],
    // row8
    [null, null, null, { face: "bY", i: 2 }, { face: "bY", i: 1 }, { face: "bY", i: 0 }, null, null, null],
  ]

const availableColors = [
    "#ff0000", // Red
    "#ffa500", // Orange
    "#ffffff", // White
    "#ffff00", // Yellow
    "#00ff00", // Green
    "#0000ff", // Blue
];