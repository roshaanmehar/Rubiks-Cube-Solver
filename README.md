# Rubik's Cube Solver - Complete Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Algorithms](#core-algorithms)
   - [Orientation Finding](#orientation-finding)
   - [Cube Solving (Kociemba Algorithm)](#cube-solving-kociemba-algorithm)
   - [Color Detection](#color-detection)
4. [Python Backend Files](#python-backend-files)
   - [solver.py](#solverpy)
   - [v2cube.py](#v2cubepy)
   - [v3cube.py](#v3cubepy)
   - [cube.py](#cubepy)
   - [matman.py](#matmanpy)
   - [color.py](#colorpy)
5. [JavaScript/Node.js Files](#javascriptnodejs-files)
   - [cubesolver.js](#cubesolverjs)
   - [cube.js](#cubejs)
   - [helper.js](#helperjs)
   - [matman.js](#matmanjs)
6. [Web Applications](#web-applications)
   - [2D Cube Nets App](#2d-cube-nets-app)
   - [3D Rubik's Cube Visualizer](#3d-rubiks-cube-visualizer)
   - [Image-Based Solver](#image-based-solver)
7. [API Reference](#api-reference)
8. [Data Structures](#data-structures)
9. [How to Run Each Frontend](#how-to-run-each-frontend)
10. [Screenshots](#screenshots)

---

## Project Overview

This project is a comprehensive Rubik's Cube solver system that provides multiple approaches to solving the cube:

1. **Manual Input via 2D Cube Nets** - Users click on stickers to set colors
2. **3D Interactive Visualization** - Three.js-based 3D cube manipulation
3. **Image-Based Detection** - Upload images of cube faces for automatic color detection
4. **Multiple Solving Algorithms** - Brute-force orientation finding and Kociemba two-phase algorithm

### Key Features

- **Orientation Correction**: Automatically finds the correct face rotations when input is ambiguous
- **Multiple Valid Orientations**: Identifies all possible valid cube states from ambiguous input
- **Real-time 3D Visualization**: Interactive Three.js cube with rotation animations
- **Color Detection**: OpenCV-based image processing for automatic sticker color identification
- **Dual Net System**: White-centered and Yellow-centered nets with 180-degree reflection linking

---

## Architecture Diagram

![Architecture Diagram Placeholder](screenshots/architecture-diagram.png)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACES                                    │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   2D Cube Nets App  │  3D Visualizer      │    Image-Based Solver           │
│   (Next.js/React)   │  (Three.js/React)   │    (Next.js + Python)           │
│   cube-nets.tsx     │  rubiks-cube.tsx    │    page.tsx + app.py            │
└─────────┬───────────┴─────────┬───────────┴─────────────┬───────────────────┘
          │                     │                         │
          ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND APIs (Flask)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/solve (backend.py)           │  /api/solve_from_images (app.py)       │
│  - Receives 6 face strings         │  - Receives 6 image files              │
│  - Validates & finds orientations  │  - Processes images for colors         │
│  - Solves with Kociemba            │  - Validates & solves                  │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                               │
          ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VALIDATION & ORIENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  cube_validator.py   │  validator.py      │  v2cube.py / v3cube.py          │
│  - Color count check │  - HSV color check │  - 4096 rotation brute-force    │
│  - Piece validity    │  - Piece validity  │  - Canonical piece matching     │
│  - 4^6 orientations  │  - Orientation     │  - Debug logging                │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                               │
          ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOLVING ENGINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  kociemba.solve()    │  matman.py                                           │
│  (External Library)  │  (Custom Implementation)                             │
│  - Two-phase algo    │  - CubeState class                                   │
│  - Optimal solutions │  - BFS-based solving                                 │
│  - ~20 moves avg     │  - Phase 1 & Phase 2                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Algorithms

### Orientation Finding

The cube orientation problem arises because users may input face colors without knowing the exact rotation of each face. The system tries all 4^6 = 4096 possible combinations of face rotations (0°, 90°, 180°, 270° for each of 6 faces).

#### Algorithm Steps:

1. **Color Count Validation**: Verify each color (W, Y, R, O, G, B) appears exactly 9 times
2. **Center Matching**: After rotation, centers must match expected positions (U=White, R=Red, F=Green, D=Yellow, L=Orange, B=Blue)
3. **Piece Validity**: Check all 8 corners and 12 edges for:
   - No duplicate colors on same piece
   - No opposite colors on same piece (W-Y, R-O, G-B)
4. **Canonical Matching** (v3cube.py): Compare extracted pieces against the master list of valid cube pieces

### Cube Solving (Kociemba Algorithm)

The Kociemba Two-Phase Algorithm is used for efficient solving:

**Phase 1**: Orient edges and corners to reduce the cube to a subset of positions reachable by only <U, D, R2, L2, F2, B2> moves.

**Phase 2**: Solve the cube using only the restricted move set.

The implementation uses the `kociemba` Python library which provides near-optimal solutions (typically 18-22 moves).

### Color Detection

Image-based color detection uses OpenCV with HSV color space analysis:

1. **Image Preprocessing**: Resize, crop to center, apply filters
2. **Grid Detection**: Divide image into 3x3 grid
3. **Color Sampling**: Extract average color from center region of each cell
4. **HSV Classification**: Map HSV values to standard Rubik's cube colors

---

## Python Backend Files

### solver.py

**Location**: `/solver.py`

**Purpose**: Simple interface to the Kociemba solving library. Converts color notation to standard Kociemba format and returns the solution.

#### Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| N/A (Script) | cube string | solution string | Converts lowercase colors to uppercase face chars and solves |

#### Color Mapping:
```python
w -> U (Up/White)
r -> R (Right/Red)
g -> F (Front/Green)
y -> D (Down/Yellow)
o -> L (Left/Orange)
b -> B (Back/Blue)
```

#### Example Usage:
```python
cube = "wywywyywyggbgggoggrrrrrrrobwwywywyywooorooooggbbbbbrbb"
cube = cube.replace('w', 'U').replace('r', 'R').replace('g', 'F')
cube = cube.replace('y', 'D').replace('o', 'L').replace('b', 'B')
solution = kociemba.solve(cube)
# Output: "R U R' U' R' F R2 U' R' U' R U R' F'"
```

---

### v2cube.py

**Location**: `/v2cube.py`

**Purpose**: Brute-force orientation finder that tests all 4096 possible face rotation combinations to find valid cube states.

#### Global Variables:

| Variable | Type | Description |
|----------|------|-------------|
| `u, r, f, d, l, b` | `list[str]` | Six faces, each a list of 9 color characters |
| `opposites` | `dict` | Maps each color to its opposite (w<->y, r<->o, g<->b) |
| `valid_colors` | `set` | Set of valid color characters {'w','y','r','o','g','b'} |

#### Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `mapColorToFace(faceArr, faceString)` | list, str | None | Populates a face array from a 9-character string |
| `check_color_counts(faces)` | list[list] | bool | Returns True if each color appears exactly 9 times |
| `rotate_face_90(face)` | list | list | Rotates a 3x3 face 90° clockwise |
| `rotate_face(face, times)` | list, int | list | Rotates a face by times*90° clockwise |
| `check_piece_validity(piece_str)` | str | tuple(bool, str) | Validates corner/edge piece has no duplicates or opposites |
| `is_valid_arrangement(u,r,f,d,l,b)` | 6 lists | tuple(bool, str) | Full validation of cube state including centers, corners, edges |
| `find_valid_orientations(u,r,f,d,l,b)` | 6 lists | list[str] | Returns all valid 54-char state strings |

#### Face Index Layout:
```
Each face uses indices 0-8:
    0 1 2
    3 4 5
    6 7 8
Center (index 4) must match expected color after rotation.
```

#### Corner Definitions:
```python
corners = [
    (u[0] + l[2] + b[0], "ulb corner"),  # Up-Left-Back
    (u[2] + r[2] + b[2], "urb corner"),  # Up-Right-Back
    (u[6] + l[0] + f[0], "ulf corner"),  # Up-Left-Front
    (u[8] + r[0] + f[2], "urf corner"),  # Up-Right-Front
    (d[0] + l[6] + f[6], "dlf corner"),  # Down-Left-Front
    (d[2] + r[6] + f[8], "drf corner"),  # Down-Right-Front
    (d[6] + l[8] + b[8], "dlb corner"),  # Down-Left-Back
    (d[8] + r[8] + b[6], "drb corner"),  # Down-Right-Back
]
```

#### Edge Definitions:
```python
edges = [
    (u[1] + b[1], "ub edge"),   # Up-Back
    (u[5] + r[1], "ur edge"),   # Up-Right
    (u[7] + f[1], "uf edge"),   # Up-Front
    (u[3] + l[1], "ul edge"),   # Up-Left
    (l[5] + f[3], "lf edge"),   # Left-Front
    (r[3] + f[5], "rf edge"),   # Right-Front
    (r[5] + b[5], "rb edge"),   # Right-Back
    (l[3] + b[3], "lb edge"),   # Left-Back
    (d[1] + f[7], "df edge"),   # Down-Front
    (d[5] + r[7], "dr edge"),   # Down-Right
    (d[7] + b[7], "db edge"),   # Down-Back
    (d[3] + l[7], "dl edge"),   # Down-Left
]
```

---

### v3cube.py

**Location**: `/v3cube.py`

**Purpose**: Advanced orientation finder with canonical piece matching. Uses frozensets to compare extracted pieces against the master list of valid Rubik's cube pieces.

#### Canonical Piece Definitions:

```python
CANONICAL_CORNERS = {
    frozenset({'w', 'r', 'g'}), frozenset({'w', 'g', 'o'}),
    frozenset({'w', 'o', 'b'}), frozenset({'w', 'b', 'r'}),
    frozenset({'y', 'g', 'r'}), frozenset({'y', 'o', 'g'}),
    frozenset({'y', 'b', 'o'}), frozenset({'y', 'r', 'b'}),
}

CANONICAL_EDGES = {
    frozenset({'w', 'r'}), frozenset({'w', 'g'}), frozenset({'w', 'o'}), frozenset({'w', 'b'}),
    frozenset({'r', 'g'}), frozenset({'g', 'o'}), frozenset({'o', 'b'}), frozenset({'b', 'r'}),
    frozenset({'y', 'r'}), frozenset({'y', 'g'}), frozenset({'y', 'o'}), frozenset({'y', 'b'}),
}
```

#### Key Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `get_pieces_from_state(u,r,f,d,l,b)` | 6 lists | tuple(set, set) | Extracts all corners and edges as frozensets |
| `find_the_correct_orientation(...)` | 6 lists | dict or None | Finds the single correct orientation matching canonical pieces |

#### Output Dictionary:
```python
{
    "combination_index": 1234,
    "rotations": (u_rot, r_rot, f_rot, d_rot, l_rot, b_rot),
    "state_string": "WWWWWWWWWRRRRRRRRR...",
    "faces": {"u": "...", "r": "...", ...}
}
```

---

### cube.py

**Location**: `/cube.py`

**Purpose**: Alternative orientation solver using backtracking instead of brute-force. Identifies faces by center color and applies constraint-based search.

#### Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `rotate_face_cw(face_stickers)` | list[9] | list[9] | 90° clockwise rotation |
| `colors_are_conflicting(*color_list)` | *colors | bool | Checks for duplicates or opposites |
| `check_cube(cube_dict)` | dict | bool | Full cube validation |
| `all_rotations_of_face(face_stickers)` | list[9] | generator | Yields all 4 rotations with rotation count |
| `solve_cube_orientation(initial_face_data)` | dict | dict | Main solver using backtracking |

#### Edge and Corner Definitions:

The file defines edges and corners using a different notation based on face-index pairs:

```python
EDGES = [
    (('U', 6), ('F', 0)), (('U', 7), ('F', 1)), (('U', 8), ('F', 2)),  # U-F edge
    (('U', 2), ('R', 0)), (('U', 5), ('R', 3)), (('U', 8), ('R', 6)),  # U-R edge
    # ... (36 edge sticker pairs total)
]

CORNERS = [
    (('U', 0), ('L', 2), ('B', 2)),  # Top layer corners
    (('U', 2), ('B', 0), ('R', 0)),
    # ... (8 corner definitions)
]
```

---

### matman.py

**Location**: `/matman.py`

**Purpose**: Full implementation of the Kociemba two-phase algorithm from scratch. Includes CubeState class with rotation logic, BFS-based solving, and cube visualization.

#### Classes:

##### CubeState

Represents a complete Rubik's cube state with efficient operations.

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `__init__(face_matrices)` | dict or None | CubeState | Initialize from matrices or create solved cube |
| `copy()` | - | CubeState | Deep copy of state |
| `to_string()` | - | str | 54-char string in URFDLB order |
| `rotate_face(face, direction)` | str, str | CubeState | Returns new state after rotation |
| `get_corner(corner_indices)` | list | list[str] | Get colors at corner |
| `get_edge(edge_indices)` | list | list[str] | Get colors at edge |
| `get_all_corners_and_edges()` | - | tuple | All corners and edges with colors |
| `is_valid(verbose)` | bool | bool | Validate cube state |
| `is_solved()` | - | bool | Check if cube is solved |
| `apply_move_sequence(moves)` | list | CubeState | Apply sequence of moves |
| `scramble(num_moves)` | int | tuple | Random scramble |

#### Rotation Logic:

```python
def rotate_face(self, face, direction):
    # direction: 'cw' (clockwise), 'ccw' (counter-clockwise), '2' (180°)
    
    # Face rotation uses np.rot90:
    # 'cw':  k=3 (270° counter-clockwise = 90° clockwise)
    # 'ccw': k=1 (90° counter-clockwise)
    # '2':   k=2 (180°)
    
    # Adjacent face updates depend on which face is rotated
    # Example for 'w' (white/top) face clockwise:
    # - Green[0,:] <- Orange[:,2] (reversed)
    # - Orange[:,2] <- Blue[0,:]
    # - Blue[0,:] <- Red[:,0] (reversed)
    # - Red[:,0] <- saved Green[0,:]
```

#### Solving Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `kociemba_phase1(cube_state, max_depth, timeout)` | CubeState, int, int | tuple | BFS to orient edges/corners |
| `kociemba_phase2(cube_state, max_depth, timeout)` | CubeState, int, int | tuple | BFS to solve while preserving orientation |
| `solve_cube(cube_state, phase1_depth, phase2_depth, timeout)` | CubeState, int, int, int | tuple | Full two-phase solve |
| `print_move_sequence(moves)` | list | None | Pretty print solution |
| `visualize_cube(cube_state)` | CubeState | str | ASCII art visualization |

#### Cube Visualization Output:
```
                  |--------------|
                  | w | w | w |
                  |--------------|
                  | w | w | w |
                  |--------------|
                  | w | w | w |
                  |--------------|
|--------------|--------------|--------------|--------------|
| o | o | o | g | g | g | r | r | r | b | b | b |
|--------------|--------------|--------------|--------------|
| o | o | o | g | g | g | r | r | r | b | b | b |
|--------------|--------------|--------------|--------------|
| o | o | o | g | g | g | r | r | r | b | b | b |
|--------------|--------------|--------------|--------------|
                  |--------------|
                  | y | y | y |
                  |--------------|
                  | y | y | y |
                  |--------------|
                  | y | y | y |
                  |--------------|
```

---

### color.py

**Location**: `/color.py`

**Purpose**: Image-based color detection using OpenCV. Processes cube face images to extract the 9 sticker colors.

#### Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `extract_center_square(image)` | ndarray | ndarray | Extract center 1/9th of image |
| `detect_dots(square_img)` | ndarray | tuple(list, ndarray) | Detect orientation dots (for physical cube markers) |
| `check_orientation(dots, img_shape)` | list, tuple | tuple(bool, dict) | Check if image needs rotation |
| `rotate_image(image, angle)` | ndarray, float | ndarray | Rotate image by angle |
| `find_correct_orientation(image)` | ndarray | tuple(ndarray, int) | Auto-orient based on dot detection |
| `detect_grid(image)` | ndarray | list[ndarray] | Split image into 9 cells |
| `identify_colors(cells)` | list[ndarray] | list[str] | Classify color of each cell |
| `visualize_results(image, colors)` | ndarray, list | ndarray | Create annotated result image |
| `main()` | - | None | CLI interface |

#### Color Reference Values (BGR):
```python
color_references = {
    'W': (200, 200, 200),  # White
    'Y': (0, 230, 230),    # Yellow
    'G': (0, 180, 0),      # Green
    'B': (200, 0, 0),      # Blue (BGR)
    'R': (0, 0, 200),      # Red (BGR)
    'O': (0, 140, 240)     # Orange
}
```

#### Usage:
```bash
python color.py
# Enter path when prompted, or press Enter for 'image.jpeg'
```

---

## JavaScript/Node.js Files

### cubesolver.js

**Location**: `/cubesolver.js`

**Purpose**: Node.js cube solver using the `cubejs` library. Validates input, converts to facelet string, and solves.

#### Dependencies:
```javascript
const Cube = require('cubejs');  // npm install cubejs
```

#### Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `validateCube(cubeData)` | Array[6][9] | {isValid, error} | Validate cube configuration |
| `getColorMapping(cubeData)` | Array[6][9] | Object | Map colors to face chars based on centers |
| `convertToFaceletString(cubeData)` | Array[6][9] | String | Convert to cubejs format |
| `solveRubiksCube(cubeData)` | Array[6][9] | {solution, faceletString} or {error} | Main solve function |
| `parseCommandLineArgs()` | - | Array or null | Parse CLI input |
| `applyAlgorithm(cube, algorithm)` | Cube, String | {success, resultCube} or {error} | Apply move sequence |

#### Input Format:
```javascript
const cubeData = [
    ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'], // Up (white)
    ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'], // Right (red)
    ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'], // Front (green)
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'], // Down (yellow)
    ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'], // Left (orange)
    ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']  // Back (blue)
];
```

#### Usage:
```bash
node cubesolver.js                    # Use built-in example
node cubesolver.js '[[...], ...]'     # Pass JSON array
node cubesolver.js cube_data.json     # Load from file
```

---

### cube.js

**Location**: `/cube.js`

**Purpose**: Utility to convert cubejs internal state representation to color-based representation.

#### Color Mapping:
```javascript
const colorMapping = ['w', 'r', 'b', 'o', 'g', 'y'];
// Index 0 -> White, 1 -> Red, 2 -> Blue, 3 -> Orange, 4 -> Green, 5 -> Yellow
```

#### Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `convertToColors(cube)` | Cube | Object | Convert internal indices to color chars |

#### Output Structure:
```javascript
{
    center: ['w', 'r', 'b', 'o', 'g', 'y'],
    cp: [...],  // Corner permutation
    co: [...],  // Corner orientation
    ep: [...],  // Edge permutation
    eo: [...]   // Edge orientation
}
```

---

### helper.js

**Location**: `/helper.js`

**Purpose**: Validates 3-character color strings for piece validity (used for corners).

#### Validation Rules:
1. String must be exactly 3 characters
2. Only allowed characters: y, w, r, b, g, o
3. No character can appear more than once
4. No opposite color pairs (b-g, y-w, o-r)

#### Usage:
```bash
node helper.js "wrg"  # Output: ok
node helper.js "wry"  # Output: not ok - Characters 'w' and 'y' are opposites
node helper.js "wrw"  # Output: not ok - Character 'w' appears more than once
```

---

### matman.js

**Location**: `/matman.js`

**Purpose**: Image-based face scanner using the `sharp` library. Processes 6 cube face images and detects sticker colors using RGB analysis.

#### Dependencies:
```javascript
import sharp from 'sharp';  // npm install sharp
```

#### Configuration:
```javascript
const IMAGE_PATHS = [
    'images/white.jpg',   // Face 1 (white center)
    'images/red.jpg',     // Face 2 (red center)
    'images/green.jpg',   // Face 3 (green center)
    'images/yellow.jpg',  // Face 4 (yellow center)
    'images/orange.jpg',  // Face 5 (orange center)
    'images/blue.jpg'     // Face 6 (blue center)
];

const FACE_ORDER = ['w', 'r', 'g', 'y', 'o', 'b'];
```

#### Functions:

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `determineColorByRGB(r, g, b)` | int, int, int | char | Classify RGB values to color char |
| `processCubeFace(imagePath, faceIndex)` | string, int | Promise<{cellColors, centerColor}> | Process single face image |
| `main()` | - | Promise<string> | Process all faces, return 54-char string |

#### Color Detection Thresholds:
```javascript
// White: r > 200 && g > 200 && b > 200
// Yellow: r > 180 && g > 180 && b < 100
// Red: r > 150 && g < 100 && b < 100
// Orange: r > 180 && 80 < g < 180 && b < 80
// Green: r < 100 && g > 150 && b < 100
// Blue: r < 100 && g < 100 && b > 150
```

#### Output Files:
- `output/cube_colors.txt` - 54-character color string
- `output/cube_colors_readable.txt` - Human-readable face breakdown
- `output/debug_face_N.png` - Debug images with sampling points

---

## Web Applications

### 2D Cube Nets App

**Location**: `/2drubikscube/cube-nets-app/`

**Main Component**: `app/cube-nets.tsx`

**Backend**: `backend/backend.py` + `backend/cube_validator.py`

#### Features:
- **Dual Net Display**: White-centered and Yellow-centered layouts
- **180° Reflection Linking**: Shared faces (B, O, R, G) mirror between nets
- **Click-to-Cycle Colors**: Click any sticker (except center) to cycle through colors
- **Face Rotation**: Rotate entire faces clockwise
- **Backend Solving**: Sends state to Flask API for validation and solving
- **Multiple Solutions**: Displays all valid orientations that solve

#### State Structure:
```typescript
const [faceArrays, setFaceArrays] = useState({
    bW: Array(9).fill("#0000ff"),  // Blue (white side)
    oW: Array(9).fill("#ffa500"),  // Orange (white side)
    rW: Array(9).fill("#ff0000"),  // Red (white side)
    gW: Array(9).fill("#00ff00"),  // Green (white side)
    wW: Array(9).fill("#ffffff"),  // White (unlinked)
    bY: Array(9).fill("#0000ff"),  // Blue (yellow side)
    oY: Array(9).fill("#ffa500"),  // Orange (yellow side)
    rY: Array(9).fill("#ff0000"),  // Red (yellow side)
    gY: Array(9).fill("#00ff00"),  // Green (yellow side)
    yY: Array(9).fill("#ffff00"),  // Yellow (unlinked)
});
```

#### API Payload Format:
```json
{
    "u": "wwwwwwwww",
    "r": "rrrrrrrrr",
    "f": "ggggggggg",
    "d": "yyyyyyyyy",
    "l": "ooooooooo",
    "b": "bbbbbbbbb"
}
```

#### Key Functions:

| Function | Description |
|----------|-------------|
| `cycleColor(faceName, index)` | Cycle sticker color, mirror to opposite net |
| `rotateFace(faceName)` | Rotate face clockwise, sync linked face |
| `convertStateForApi()` | Convert hex colors to API payload |
| `handleSolveClick()` | Send to backend, display solutions |

---

### 3D Rubik's Cube Visualizer

**Location**: `/rubiks-cube-visualizer/`

**Main Component**: `components/rubiks-cube.tsx`

#### Technology Stack:
- Three.js for 3D rendering
- OrbitControls for camera manipulation
- React useRef/useEffect for lifecycle management

#### Features:
- **Interactive 3D Cube**: Rotate camera with mouse drag
- **Click-to-Select Face**: Raycasting detects clicked face
- **Animated Rotations**: Smooth 90° face rotation animations
- **Color Editing**: Click faces to open color picker

#### Face Color Constants:
```typescript
const FACE_COLORS = {
    front: 0xff0000,  // Red
    back: 0xffa500,   // Orange
    up: 0xffffff,     // White
    down: 0xffff00,   // Yellow
    left: 0x00ff00,   // Green
    right: 0x0000ff,  // Blue
};
```

#### Cube State Structure:
```typescript
cubeState: Record<string, number[]>
// Each face has 9 hex color values
// Index layout:
//   0 1 2
//   3 4 5
//   6 7 8
```

#### Key Methods:

| Method | Description |
|--------|-------------|
| `createCubies()` | Generate 27 cube pieces (3x3x3) |
| `getCubieIndexOnFace(face, x, y, z)` | Map 3D position to face index |
| `updateCubieColors()` | Sync Three.js materials with state |
| `rotateFace(face, direction)` | Initiate rotation animation |
| `updateCubeStateAfterRotation()` | Update state arrays after rotation |

---

### Image-Based Solver

**Location**: `/imagebased/`

**Frontend**: `frontend/` (Next.js)

**Backend**: `backend/` (Flask + OpenCV)

#### Backend Files:

##### app.py
Main Flask application with endpoint `/api/solve_from_images`.

**Request**: `POST` with 6 image files (multipart/form-data)

**Response**:
```json
{
    "solution": "R U R' U' R' F R2 U' R' U' R U R' F'"
}
```
or
```json
{
    "error": {
        "message": "Error description",
        "errors": ["File 'face_1.jpg': Invalid center color..."],
        "processed_faces": [...]
    }
}
```

##### image_processor.py
OpenCV-based image processing.

**HSV Color Ranges**:
```python
COLOR_RANGES_HSV = {
    'w': [(0, 0, 180), (179, 55, 255)],      # White
    'y': [(20, 80, 80), (35, 255, 255)],     # Yellow
    'b': [(95, 80, 50), (130, 255, 255)],    # Blue
    'g': [(40, 60, 40), (85, 255, 255)],     # Green
    'r1': [(0, 80, 50), (10, 255, 255)],     # Red (low hue)
    'r2': [(165, 80, 50), (179, 255, 255)],  # Red (high hue)
    'o': [(5, 100, 100), (20, 255, 255)],    # Orange
}
```

##### validator.py
Cube state validation and orientation finding (similar to cube_validator.py).

---

## API Reference

### POST /api/solve

**Backend**: `2drubikscube/cube-nets-app/backend/backend.py`

**Request Body**:
```json
{
    "u": "string (9 chars, lowercase colors)",
    "r": "string (9 chars)",
    "f": "string (9 chars)",
    "d": "string (9 chars)",
    "l": "string (9 chars)",
    "b": "string (9 chars)"
}
```

**Success Response** (200):
```json
{
    "solutions": [
        {
            "orientation_index": 0,
            "kociemba_input": "UUUUUUUUURRRRRRRRR...",
            "solution": "R U R' U' R' F R2..."
        }
    ],
    "total_valid_orientations": 1,
    "successful_solutions": 1,
    "failed_solutions": 0
}
```

**Error Response** (400):
```json
{
    "error": "No valid cube orientations found.",
    "debug_info": [...]
}
```

---

### POST /api/solve_from_images

**Backend**: `imagebased/backend/app.py`

**Request**: `multipart/form-data` with 6 image files (keys: `face_0` to `face_5`)

**Success Response** (200):
```json
{
    "solution": "R U R' U' R' F R2 U' R' U' R U R' F'"
}
```

**Error Response** (400/500):
```json
{
    "error": {
        "message": "Description of error",
        "errors": ["Specific file errors..."],
        "processed_faces": [
            {"filename": "...", "detected_center": "w", "detected_string": "wwwwwwwww"}
        ]
    }
}
```

---

## Data Structures

### Face Index Layout

All implementations use the same 3x3 face indexing:

```
    0 | 1 | 2
    ---------
    3 | 4 | 5
    ---------
    6 | 7 | 8

Index 4 = Center (determines face identity)
```

### Standard Color Scheme

| Color | Face | Character | Hex Code |
|-------|------|-----------|----------|
| White | Up | w/W/U | #FFFFFF / 0xffffff |
| Yellow | Down | y/Y/D | #FFFF00 / 0xffff00 |
| Red | Right | r/R | #FF0000 / 0xff0000 |
| Orange | Left | o/O/L | #FFA500 / 0xffa500 |
| Green | Front | g/G/F | #00FF00 / 0x00ff00 |
| Blue | Back | b/B | #0000FF / 0x0000ff |

### Opposite Color Pairs

```
White  <-> Yellow  (Up/Down)
Red    <-> Orange  (Right/Left)
Green  <-> Blue    (Front/Back)
```

### Kociemba String Format

54-character string in URFDLB order:
- Characters 0-8: Up face
- Characters 9-17: Right face
- Characters 18-26: Front face
- Characters 27-35: Down face
- Characters 36-44: Left face
- Characters 45-53: Back face

Uses uppercase face characters: U, R, F, D, L, B

### Move Notation

Standard Rubik's Cube notation:
- `U` = Up clockwise
- `U'` = Up counter-clockwise
- `U2` = Up 180°
- Same for R, F, D, L, B

---

## How to Run Each Frontend

### 1. 2D Cube Nets App

![2D Cube Nets Screenshot Placeholder](screenshots/cube-nets-app.png)

**Prerequisites**:
- Node.js 18+
- Python 3.10+
- pip packages: `flask`, `flask-cors`, `kociemba`

**Steps**:

```bash
# Terminal 1: Start the Flask backend
cd 2drubikscube/cube-nets-app/backend
pip install flask flask-cors kociemba
python backend.py
# Backend runs on http://localhost:5001

# Terminal 2: Start the Next.js frontend
cd 2drubikscube/cube-nets-app
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

**To take screenshot**: Open http://localhost:3000 in browser

---

### 2. 3D Rubik's Cube Visualizer

![3D Visualizer Screenshot Placeholder](screenshots/3d-visualizer.png)

**Prerequisites**:
- Node.js 18+

**Steps**:

```bash
cd rubiks-cube-visualizer
npm install
npm run dev
# Runs on http://localhost:3000
```

**To take screenshot**: Open http://localhost:3000 in browser

---

### 3. Image-Based Solver

![Image Solver Screenshot Placeholder](screenshots/image-solver.png)

**Prerequisites**:
- Node.js 18+
- Python 3.10+
- pip packages: `flask`, `flask-cors`, `kociemba`, `opencv-python`, `numpy`, `pillow`

**Steps**:

```bash
# Terminal 1: Start the Flask backend
cd imagebased/backend
pip install flask flask-cors kociemba opencv-python numpy pillow
python app.py
# Backend runs on http://localhost:5001

# Terminal 2: Start the Next.js frontend
cd imagebased/frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

**To take screenshot**: Open http://localhost:3000 in browser

---

### 4. Standalone 2D/3D HTML Visualizers

![2D HTML Visualizer Screenshot Placeholder](screenshots/2d-html-visualizer.png)

![3D HTML Visualizer Screenshot Placeholder](screenshots/3d-html-visualizer.png)

**Prerequisites**:
- Modern web browser
- Python 3 (for simple HTTP server)

**Steps**:

```bash
# For 2D visualizer
cd 2drubikscube
python -m http.server 8000
# Open http://localhost:8000/index.html

# For 3D visualizer  
cd 3drubikscube
python -m http.server 8000
# Open http://localhost:8000/index.html
```

---

### 5. Python Scripts (Standalone)

**Prerequisites**:
- Python 3.10+
- pip packages vary by script

**solver.py**:
```bash
pip install kociemba
python solver.py
```

**v2cube.py / v3cube.py**:
```bash
python v2cube.py  # No external dependencies
python v3cube.py  # No external dependencies
```

**cube.py**:
```bash
python cube.py  # No external dependencies
```

**matman.py**:
```bash
pip install numpy
python matman.py
```

**color.py**:
```bash
pip install opencv-python numpy matplotlib
python color.py
```

---

### 6. JavaScript Scripts (Standalone)

**Prerequisites**:
- Node.js 18+

**cubesolver.js**:
```bash
npm install cubejs
node cubesolver.js
```

**helper.js**:
```bash
node helper.js "wrg"  # No dependencies
```

**matman.js**:
```bash
npm install sharp
node matman.js
# Note: Requires images in ./images/ folder
```

---

## Screenshots

Replace these placeholders with actual screenshots after running each application:

### Architecture Diagram
![Architecture Diagram](screenshots/architecture-diagram.png)
*System architecture showing data flow between components*

### 2D Cube Nets App
![2D Cube Nets App](screenshots/cube-nets-app.png)
*Main interface showing white-centered and yellow-centered cube nets*

### 3D Rubik's Cube Visualizer
![3D Visualizer](screenshots/3d-visualizer.png)
*Interactive 3D cube with rotation controls*

### Image-Based Solver
![Image Solver](screenshots/image-solver.png)
*Upload interface for cube face images*

### 2D HTML Visualizer
![2D HTML](screenshots/2d-html-visualizer.png)
*Standalone HTML/JS cube net viewer*

### 3D HTML Visualizer
![3D HTML](screenshots/3d-html-visualizer.png)
*Standalone Three.js cube viewer*

### Color Detection Output
![Color Detection](screenshots/color-detection.png)
*Sample output from color.py showing detected stickers*

### Solution Output
![Solution](screenshots/solution-output.png)
*Example solution display with move notation*

---

## Creating Screenshots

To populate the screenshots folder:

1. Create a `screenshots/` folder in the project root:
   ```bash
   mkdir screenshots
   ```

2. For each application:
   - Start the application following the instructions above
   - Open in browser (or run in terminal for scripts)
   - Take screenshot (Windows: Win+Shift+S, Mac: Cmd+Shift+4)
   - Save to `screenshots/` with the corresponding filename

3. For architecture diagram:
   - Use a tool like draw.io, Mermaid, or Excalidraw
   - Export as PNG to `screenshots/architecture-diagram.png`

---

## Appendix: File Summary Table

| File | Language | Category | Key Function |
|------|----------|----------|--------------|
| solver.py | Python | Solving | Kociemba wrapper |
| v2cube.py | Python | Orientation | 4096 brute-force |
| v3cube.py | Python | Orientation | Canonical matching |
| cube.py | Python | Orientation | Backtracking search |
| matman.py | Python | Solving | Custom Kociemba impl |
| color.py | Python | Image | OpenCV color detection |
| backend.py | Python | API | Flask endpoint (nets) |
| cube_validator.py | Python | Validation | Piece validation |
| app.py | Python | API | Flask endpoint (images) |
| image_processor.py | Python | Image | HSV classification |
| validator.py | Python | Validation | Image-based validation |
| cubesolver.js | JavaScript | Solving | cubejs wrapper |
| cube.js | JavaScript | Utility | State conversion |
| helper.js | JavaScript | Validation | Piece validation |
| matman.js | JavaScript | Image | sharp-based scanning |
| cube-nets.tsx | TypeScript | Frontend | 2D nets React app |
| rubiks-cube.tsx | TypeScript | Frontend | 3D Three.js React |
| rubiksCube.js | JavaScript | Frontend | 3D standalone |
| cubeFaceEditor.js | JavaScript | Frontend | Color picker modal |
| cube2D.js | JavaScript | Frontend | 2D standalone |
