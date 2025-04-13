@echo off
echo ===================================================
echo Rubik's Cube Solver - Startup Script
echo ===================================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.7+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Create directories if they don't exist
if not exist "backend" mkdir backend
if not exist "frontend" mkdir frontend

REM Save the Flask backend file
echo [INFO] Setting up Flask backend...
if not exist "backend\check-color-counts.py" (
    echo import itertools > backend\check-color-counts.py
    echo import json >> backend\check-color-counts.py
    echo import kociemba >> backend\check-color-counts.py
    echo from flask import Flask, request, jsonify >> backend\check-color-counts.py
    echo from flask_cors import CORS # Import CORS >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo # --- Configuration --- >> backend\check-color-counts.py
    echo # Standard color mapping (lowercase used internally, uppercase for Kociemba) >> backend\check-color-counts.py
    echo COLOR_TO_FACE_CHAR = { >> backend\check-color-counts.py
    echo     'w': 'U', 'r': 'R', 'g': 'F', 'y': 'D', 'o': 'L', 'b': 'B' >> backend\check-color-counts.py
    echo } >> backend\check-color-counts.py
    echo VALID_COLORS = set(COLOR_TO_FACE_CHAR.keys^(^)^) >> backend\check-color-counts.py
    echo EXPECTED_CENTERS = {'U': 'w', 'R': 'r', 'F': 'g', 'D': 'y', 'L': 'o', 'B': 'b'} >> backend\check-color-counts.py
    echo FACE_ORDER_KOCIEMBA = ['U', 'R', 'F', 'D', 'L', 'B'] # Standard URFDLB order >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo # --- Orientation Checker Logic (Adapted from orientation_finder.py) --- >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo # Define opposite colors >> backend\check-color-counts.py
    echo opposites = {'w': 'y', 'y': 'w', 'r': 'o', 'o': 'r', 'g': 'b', 'b': 'g'} >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo def check_color_counts(face_lists): >> backend\check-color-counts.py
    echo     """Checks if each color appears exactly 9 times.""" >> backend\check-color-counts.py
    echo     all_stickers = list(itertools.chain.from_iterable(face_lists)) >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     if len(all_stickers) != 54: >> backend\check-color-counts.py
    echo         return False, f"Invalid number of stickers: {len(all_stickers)} (expected 54)" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     invalid_colors = [c for c in all_stickers if c not in VALID_COLORS] >> backend\check-color-counts.py
    echo     if invalid_colors: >> backend\check-color-counts.py
    echo         return False, f"Invalid colors found: {set(invalid_colors)}" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     for c in VALID_COLORS: >> backend\check-color-counts.py
    echo         count = all_stickers.count(c) >> backend\check-color-counts.py
    echo         if count != 9: >> backend\check-color-counts.py
    echo             return False, f"Color '{c}' appears {count} times (expected 9)" >> backend\check-color-counts.py
    echo     return True, "" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo def rotate_face_90(face_list): >> backend\check-color-counts.py
    echo     """Rotates a 9-element face list 90 degrees clockwise.""" >> backend\check-color-counts.py
    echo     return [ >> backend\check-color-counts.py
    echo         face_list[6], face_list[3], face_list[0], >> backend\check-color-counts.py
    echo         face_list[7], face_list[4], face_list[1], >> backend\check-color-counts.py
    echo         face_list[8], face_list[5], face_list[2] >> backend\check-color-counts.py
    echo     ] >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo def rotate_face(face_list, times): >> backend\check-color-counts.py
    echo     """Rotates a face list `times` * 90 degrees clockwise.""" >> backend\check-color-counts.py
    echo     result = face_list[:] >> backend\check-color-counts.py
    echo     for _ in range(times %% 4): # Ensure times is 0, 1, 2, or 3 >> backend\check-color-counts.py
    echo         result = rotate_face_90(result) >> backend\check-color-counts.py
    echo     return result >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo def check_piece_validity(piece_str): >> backend\check-color-counts.py
    echo     """Checks if an edge (2 chars) or corner (3 chars) string is valid.""" >> backend\check-color-counts.py
    echo     if len(set(piece_str)) != len(piece_str): >> backend\check-color-counts.py
    echo         return False, f"repeated color in piece '{piece_str}'" >> backend\check-color-counts.py
    echo     for c1 in piece_str: >> backend\check-color-counts.py
    echo         for c2 in piece_str: >> backend\check-color-counts.py
    echo             if c1 != c2 and opposites.get(c1) == c2: >> backend\check-color-counts.py
    echo                 return False, f"opposite colors '{c1}'/'{c2}' in piece '{piece_str}'" >> backend\check-color-counts.py
    echo     return True, "" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo def is_valid_arrangement(u, r, f, d, l, b): >> backend\check-color-counts.py
    echo     """ >> backend\check-color-counts.py
    echo     Checks centers, edges, and corners for a given orientation of face lists. >> backend\check-color-counts.py
    echo     Assumes standard color scheme for centers (U=w, R=r, etc.). >> backend\check-color-counts.py
    echo     Returns (True, "") if valid, or (False, reason) if invalid. >> backend\check-color-counts.py
    echo     """ >> backend\check-color-counts.py
    echo     faces = {'U': u, 'R': r, 'F': f, 'D': d, 'L': l, 'B': b} >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # 1. Check Center Pieces >> backend\check-color-counts.py
    echo     for face_char, expected_color in EXPECTED_CENTERS.items(): >> backend\check-color-counts.py
    echo         if faces[face_char][4] != expected_color: >> backend\check-color-counts.py
    echo             return False, f"Center piece mismatch: {face_char} center is '{faces[face_char][4]}', expected '{expected_color}'" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # 2. Define and Check Corners (using standard URFDLB notation indices) >> backend\check-color-counts.py
    echo     corners = [ >> backend\check-color-counts.py
    echo         (u[8] + r[0] + f[2], "URF"), (u[6] + f[0] + l[2], "UFL"), >> backend\check-color-counts.py
    echo         (u[0] + l[0] + b[2], "ULB"), (u[2] + b[0] + r[2], "UBR"), >> backend\check-color-counts.py
    echo         (d[2] + f[8] + r[6], "DFR"), (d[0] + l[8] + f[6], "DLF"), >> backend\check-color-counts.py
    echo         (d[6] + b[8] + l[6], "DBL"), (d[8] + r[8] + b[6], "DRB"), >> backend\check-color-counts.py
    echo     ] >> backend\check-color-counts.py
    echo     for piece_str, label in corners: >> backend\check-color-counts.py
    echo         ok, reason = check_piece_validity(piece_str) >> backend\check-color-counts.py
    echo         if not ok: return False, f"Invalid {label} corner: {reason}" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # 3. Define and Check Edges >> backend\check-color-counts.py
    echo     edges = [ >> backend\check-color-counts.py
    echo         (u[7] + f[1], "UF"), (u[5] + r[1], "UR"), (u[1] + b[1], "UB"), (u[3] + l[1], "UL"), >> backend\check-color-counts.py
    echo         (d[1] + f[7], "DF"), (d[5] + r[7], "DR"), (d[7] + b[7], "DB"), (d[3] + l[7], "DL"), # Note: L face indices were corrected from original script example >> backend\check-color-counts.py
    echo         (f[5] + r[3], "FR"), (f[3] + l[5], "FL"), (b[5] + l[3], "BL"), (b[3] + r[5], "BR"), >> backend\check-color-counts.py
    echo     ] >> backend\check-color-counts.py
    echo     for piece_str, label in edges: >> backend\check-color-counts.py
    echo         ok, reason = check_piece_validity(piece_str) >> backend\check-color-counts.py
    echo         if not ok: return False, f"Invalid {label} edge: {reason}" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     return True, "" # All checks passed >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo def validate_and_orient(u_str, r_str, f_str, d_str, l_str, b_str): >> backend\check-color-counts.py
    echo     """ >> backend\check-color-counts.py
    echo     Takes 6 face strings (lowercase colors), checks counts, finds valid orientation. >> backend\check-color-counts.py
    echo     Returns (urfldb_kociemba_string, None) on success, or (None, error_message) on failure. >> backend\check-color-counts.py
    echo     """ >> backend\check-color-counts.py
    echo     # Convert input strings to lists >> backend\check-color-counts.py
    echo     try: >> backend\check-color-counts.py
    echo         faces_input = { >> backend\check-color-counts.py
    echo             'U': list(u_str), 'R': list(r_str), 'F': list(f_str), >> backend\check-color-counts.py
    echo             'D': list(d_str), 'L': list(l_str), 'B': list(b_str) >> backend\check-color-counts.py
    echo         } >> backend\check-color-counts.py
    echo         if any(len(face) != 9 for face in faces_input.values()): >> backend\check-color-counts.py
    echo              raise ValueError("All faces must have 9 stickers.") >> backend\check-color-counts.py
    echo     except Exception as e: >> backend\check-color-counts.py
    echo         return None, f"Input error: {e}" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # 1. Check Color Counts >> backend\check-color-counts.py
    echo     ok, reason = check_color_counts(faces_input.values()) >> backend\check-color-counts.py
    echo     if not ok: >> backend\check-color-counts.py
    echo         return None, reason >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # 2. Brute force check all 4^6 = 4096 orientations >> backend\check-color-counts.py
    echo     #   Input faces MUST correspond to their center colors (u_str has 'w' center, etc.) >> backend\check-color-counts.py
    echo     #   This checks if the *relative* orientations are valid. >> backend\check-color-counts.py
    echo     all_rotations = [0, 1, 2, 3] >> backend\check-color-counts.py
    echo     for u_rot, r_rot, f_rot, d_rot, l_rot, b_rot in itertools.product(all_rotations, repeat=6): >> backend\check-color-counts.py
    echo         # Rotate faces according to current combination >> backend\check-color-counts.py
    echo         u_rotated = rotate_face(faces_input['U'], u_rot) >> backend\check-color-counts.py
    echo         r_rotated = rotate_face(faces_input['R'], r_rot) >> backend\check-color-counts.py
    echo         f_rotated = rotate_face(faces_input['F'], f_rot) >> backend\check-color-counts.py
    echo         d_rotated = rotate_face(faces_input['D'], d_rot) >> backend\check-color-counts.py
    echo         l_rotated = rotate_face(faces_input['L'], l_rot) >> backend\check-color-counts.py
    echo         b_rotated = rotate_face(faces_input['B'], b_rot) >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo         # Check if this arrangement is valid >> backend\check-color-counts.py
    echo         valid, reason = is_valid_arrangement( >> backend\check-color-counts.py
    echo             u_rotated, r_rotated, f_rotated, d_rotated, l_rotated, b_rotated >> backend\check-color-counts.py
    echo         ) >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo         if valid: >> backend\check-color-counts.py
    echo             # Found a valid orientation! Construct the Kociemba string (URFDLB order). >> backend\check-color-counts.py
    echo             # Convert lowercase colors to uppercase face chars needed by kociemba. >> backend\check-color-counts.py
    echo             try: >> backend\check-color-counts.py
    echo                 kociemba_str = "".join( >> backend\check-color-counts.py
    echo                     COLOR_TO_FACE_CHAR[c] for c in itertools.chain( >> backend\check-color-counts.py
    echo                         u_rotated, r_rotated, f_rotated, d_rotated, l_rotated, b_rotated >> backend\check-color-counts.py
    echo                     ) >> backend\check-color-counts.py
    echo                 ) >> backend\check-color-counts.py
    echo                 # Final sanity check on length >> backend\check-color-counts.py
    echo                 if len(kociemba_str) != 54: >> backend\check-color-counts.py
    echo                      raise ValueError("Internal error: Generated Kociemba string is not 54 chars.") >> backend\check-color-counts.py
    echo                 return kociemba_str, None # Success >> backend\check-color-counts.py
    echo             except KeyError as e: >> backend\check-color-counts.py
    echo                  # This shouldn't happen if color counts/validity were checked >> backend\check-color-counts.py
    echo                  return None, f"Internal error: Invalid color character '{e}' during Kociemba string conversion." >> backend\check-color-counts.py
    echo             except Exception as e: >> backend\check-color-counts.py
    echo                  return None, f"Internal error: {e}" >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # If loop finishes, no valid orientation was found >> backend\check-color-counts.py
    echo     return None, "Invalid State: Colors are correct, but no valid orientation found (check edges/corners)." >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo # --- Flask App --- >> backend\check-color-counts.py
    echo app = Flask(__name__) >> backend\check-color-counts.py
    echo CORS(app) # Enable CORS for all routes, allowing requests from your Next.js app >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo @app.route('/api/solve', methods=['POST']) >> backend\check-color-counts.py
    echo def solve_cube_endpoint(): >> backend\check-color-counts.py
    echo     """API endpoint to validate and solve the cube.""" >> backend\check-color-counts.py
    echo     if not request.is_json: >> backend\check-color-counts.py
    echo         return jsonify({"error": "Request must be JSON"}), 400 >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     data = request.get_json() >> backend\check-color-counts.py
    echo     required_faces = ['u', 'r', 'f', 'd', 'l', 'b'] >> backend\check-color-counts.py
    echo     if not all(face in data for face in required_faces): >> backend\check-color-counts.py
    echo         return jsonify({"error": f"Missing one or more faces. Required: {required_faces}"}), 400 >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # Validate and orient the input faces >> backend\check-color-counts.py
    echo     kociemba_input_string, error_msg = validate_and_orient( >> backend\check-color-counts.py
    echo         data['u'], data['r'], data['f'], data['d'], data['l'], data['b'] >> backend\check-color-counts.py
    echo     ) >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     if error_msg: >> backend\check-color-counts.py
    echo         # Validation/Orientation failed >> backend\check-color-counts.py
    echo         return jsonify({"error": error_msg}), 400 # Bad Request >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo     # If validation passed, attempt to solve >> backend\check-color-counts.py
    echo     try: >> backend\check-color-counts.py
    echo         print(f"Attempting to solve: {kociemba_input_string}") # Log the input to Kociemba >> backend\check-color-counts.py
    echo         solution = kociemba.solve(kociemba_input_string) >> backend\check-color-counts.py
    echo         return jsonify({"solution": solution}) >> backend\check-color-counts.py
    echo     except ValueError as e: >> backend\check-color-counts.py
    echo         # Kociemba often uses ValueError for unsolvable states (parity, etc.) >> backend\check-color-counts.py
    echo         print(f"Solver ValueError for {kociemba_input_string}: {e}") >> backend\check-color-counts.py
    echo         return jsonify({"error": f"Solver Error: {str(e)}"}), 400 >> backend\check-color-counts.py
    echo     except Exception as e: >> backend\check-color-counts.py
    echo         # Catch any other unexpected errors during solving >> backend\check-color-counts.py
    echo         print(f"Unexpected Solver Error for {kociemba_input_string}: {e}") >> backend\check-color-counts.py
    echo         return jsonify({"error": f"Unexpected Solver Error: {str(e)}"}), 500 # Internal Server Error >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo. >> backend\check-color-counts.py
    echo if __name__ == '__main__': >> backend\check-color-counts.py
    echo     # Run in debug mode for development (auto-reloads on changes) >> backend\check-color-counts.py
    echo     # For production, use a proper WSGI server like Gunicorn or Waitress >> backend\check-color-counts.py
    echo     app.run(debug=True, port=5001) # Use a port other than Next.js default (3000) >> backend\check-color-counts.py
)

REM Create a requirements.txt file for the backend
echo flask > backend\requirements.txt
echo flask-cors >> backend\requirements.txt
echo kociemba >> backend\requirements.txt

REM Create a package.json file for the frontend
echo { > frontend\package.json
echo   "name": "cube-solver-frontend", >> frontend\package.json
echo   "version": "0.1.0", >> frontend\package.json
echo   "private": true, >> frontend\package.json
echo   "scripts": { >> frontend\package.json
echo     "dev": "next dev", >> frontend\package.json
echo     "build": "next build", >> frontend\package.json
echo     "start": "next start" >> frontend\package.json
echo   }, >> frontend\package.json
echo   "dependencies": { >> frontend\package.json
echo     "next": "^14.0.0", >> frontend\package.json
echo     "react": "^18.2.0", >> frontend\package.json
echo     "react-dom": "^18.2.0", >> frontend\package.json
echo     "lucide-react": "^0.292.0" >> frontend\package.json
echo   } >> frontend\package.json
echo } >> frontend\package.json

REM Create the app directory structure
if not exist "frontend\app" mkdir frontend\app

REM Save the cube-nets.tsx file
echo [INFO] Setting up Next.js frontend...
if not exist "frontend\app\cube-nets.tsx" (
    echo "use client" > frontend\app\cube-nets.tsx
    echo. >> frontend\app\cube-nets.tsx
    echo import { useState, useEffect, useRef } from "react" >> frontend\app\cube-nets.tsx
    echo import { >> frontend\app\cube-nets.tsx
    echo   RotateCw, >> frontend\app\cube-nets.tsx
    echo   Info, >> frontend\app\cube-nets.tsx
    echo   X, >> frontend\app\cube-nets.tsx
    echo   Maximize, >> frontend\app\cube-nets.tsx
    echo   Minimize, >> frontend\app\cube-nets.tsx
    echo   ZoomIn, >> frontend\app\cube-nets.tsx
    echo   ZoomOut, >> frontend\app\cube-nets.tsx
    echo   ChevronDown, >> frontend\app\cube-nets.tsx
    echo   ChevronUp, >> frontend\app\cube-nets.tsx
    echo   Check, >> frontend\app\cube-nets.tsx
    echo   AlertTriangle, >> frontend\app\cube-nets.tsx
    echo   Loader2, >> frontend\app\cube-nets.tsx
    echo   Send, >> frontend\app\cube-nets.tsx
    echo } from "lucide-react" >> frontend\app\cube-nets.tsx
    echo. >> frontend\app\cube-nets.tsx
    echo // Define the mapping from hex colors to lowercase color characters >> frontend\app\cube-nets.tsx
    echo const hexToColorChar: { [key: string]: string } = { >> frontend\app\cube-nets.tsx
    echo   "#ff0000": "r", // Red >> frontend\app\cube-nets.tsx
    echo   "#ffa500": "o", // Orange >> frontend\app\cube-nets.tsx
    echo   "#ffffff": "w", // White >> frontend\app\cube-nets.tsx
    echo   "#ffff00": "y", // Yellow >> frontend\app\cube-nets.tsx
    echo   "#00ff00": "g", // Green >> frontend\app\cube-nets.tsx
    echo   "#0000ff": "b", // Blue >> frontend\app\cube-nets.tsx
    echo } >> frontend\app\cube-nets.tsx
    echo. >> frontend\app\cube-nets.tsx
    echo // Define the standard face order expected by the backend validation input >> frontend\app\cube-nets.tsx
    echo const faceInputOrder = ["u", "r", "f", "d", "l", "b"] >> frontend\app\cube-nets.tsx
    echo // Define which face array corresponds to which standard face (using White Net as primary) >> frontend\app\cube-nets.tsx
    echo const faceArrayMapping: { [key: string]: string } = { >> frontend\app\cube-nets.tsx
    echo   u: "wW", // White face array maps to Up >> frontend\app\cube-nets.tsx
    echo   r: "rW", // Red face array maps to Right >> frontend\app\cube-nets.tsx
    echo   f: "gW", // Green face array maps to Front >> frontend\app\cube-nets.tsx
    echo   d: "yY", // Yellow face array maps to Down (Needs Y net for this) >> frontend\app\cube-nets.tsx
    echo   l: "oW", // Orange face array maps to Left >> frontend\app\cube-nets.tsx
    echo   b: "bW", // Blue face array maps to Back >> frontend\app\cube-nets.tsx
    echo } >> frontend\app\cube-nets.tsx
    echo. >> frontend\app\cube-nets.tsx
    echo // Backend API URL - should be environment variable in production >> frontend\app\cube-nets.tsx
    echo const API_URL = "http://localhost:5001/api/solve" >> frontend\app\cube-nets.tsx
)

REM Create a simple page.tsx file
if not exist "frontend\app\page.tsx" (
    echo "use client" > frontend\app\page.tsx
    echo. >> frontend\app\page.tsx
    echo import CubeNets from './cube-nets' >> frontend\app\page.tsx
    echo. >> frontend\app\page.tsx
    echo export default function Home() { >> frontend\app\page.tsx
    echo   return ( >> frontend\app\page.tsx
    echo     ^<CubeNets /^> >> frontend\app\page.tsx
    echo   ) >> frontend\app\page.tsx
    echo } >> frontend\app\page.tsx
)

REM Create a simple layout.tsx file
if not exist "frontend\app\layout.tsx" (
    echo "use client" > frontend\app\layout.tsx
    echo. >> frontend\app\layout.tsx
    echo export default function RootLayout({ >> frontend\app\layout.tsx
    echo   children, >> frontend\app\layout.tsx
    echo }: { >> frontend\app\layout.tsx
    echo   children: React.ReactNode >> frontend\app\layout.tsx
    echo }) { >> frontend\app\layout.tsx
    echo   return ( >> frontend\app\layout.tsx
    echo     ^<html lang="en"^> >> frontend\app\layout.tsx
    echo       ^<body^>{children}^</body^> >> frontend\app\layout.tsx
    echo     ^</html^> >> frontend\app\layout.tsx
    echo   ) >> frontend\app\layout.tsx
    echo } >> frontend\app\layout.tsx
)

REM Create a simple globals.css file
if not exist "frontend\app\globals.css" (
    echo body { > frontend\app\globals.css
    echo   margin: 0; >> frontend\app\globals.css
    echo   padding: 0; >> frontend\app\globals.css
    echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; >> frontend\app\globals.css
    echo } >> frontend\app\globals.css
)

REM Create Python virtual environment for backend
echo [INFO] Setting up Python virtual environment...
cd backend
if not exist "venv" (
    python -m venv venv
)

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    npm install
)
cd ..

REM Create a start script that will run both servers
echo @echo off > start-servers.bat
echo echo Starting Flask backend server... >> start-servers.bat
echo start cmd /k "cd backend && venv\Scripts\activate && python check-color-counts.py" >> start-servers.bat
echo echo Waiting for backend to initialize... >> start-servers.bat
echo timeout /t 3 >> start-servers.bat
echo echo Starting Next.js frontend server... >> start-servers.bat
echo start cmd /k "cd frontend && npm run dev" >> start-servers.bat
echo echo. >> start-servers.bat
echo echo Both servers are now running! >> start-servers.bat
echo echo - Backend: http://localhost:5001 >> start-servers.bat
echo echo - Frontend: http://localhost:3000 >> start-servers.bat
echo echo. >> start-servers.bat
echo echo Open your browser and navigate to http://localhost:3000 to use the Rubik's Cube Solver >> start-servers.bat
echo echo Press Ctrl+C in each terminal window to stop the servers when done >> start-servers.bat
echo pause >> start-servers.bat

REM Create a README file with instructions
echo # Rubik's Cube Solver > README.md
echo. >> README.md
echo ## Setup Instructions >> README.md
echo. >> README.md
echo This application consists of a Flask backend and a Next.js frontend. >> README.md
echo. >> README.md
echo ### Requirements: >> README.md
echo - Python 3.7+ >> README.md
echo - Node.js 14+ >> README.md
echo. >> README.md
echo ### Getting Started >> README.md
echo. >> README.md
echo 1. Run `start-cube-solver.bat` to set up the project structure and install dependencies >> README.md
echo 2. Run `start-servers.bat` to start both the backend and frontend servers >> README.md
echo 3. Open your browser and navigate to http://localhost:3000 >> README.md
echo. >> README.md
echo ### Using the Application >> README.md
echo. >> README.md
echo 1. Click on the cube stickers to change their colors >> README.md
echo 2. Use the rotation buttons to rotate faces >> README.md
echo 3. Click "Validate & Solve Cube" to find a solution >> README.md
echo 4. Follow the solution steps to solve your cube >> README.md
echo. >> README.md
echo ### Troubleshooting >> README.md
echo. >> README.md
echo - If you encounter any errors, check that both servers are running >> README.md
echo - Make sure all dependencies are installed correctly >> README.md
echo - Check the console output for any error messages >> README.md

echo.
echo [SUCCESS] Setup complete!
echo.
echo To start the application:
echo 1. Run start-servers.bat
echo 2. Open your browser and navigate to http://localhost:3000
echo.
echo Press any key to exit...
pause > nul