// rubiks-cube-solver.js
const { execSync } = require('child_process');
const fs = require('fs');

// Colors for the cube faces
const COLORS = {
  W: 'white',
  Y: 'yellow',
  G: 'green',
  B: 'blue',
  R: 'red',
  O: 'orange'
};

// Map face positions to indices
const FACE_POSITIONS = {
  U: 0, // Up
  R: 1, // Right
  F: 2, // Front
  D: 3, // Down
  L: 4, // Left
  B: 5  // Back
};

/**
 * Validate the input cube configuration
 * @param {Array} cubeData - Array of 6 faces, each with 9a stickers
 * @returns {Object} - Validation result with status and error message if any
 */
function validateCube(cubeData) {
  // Check if we have exactly 6 faces
  if (cubeData.length !== 6) {
    return { isValid: false, error: `Expected 6 faces, got ${cubeData.length}` };
  }

  // Check if each face has exactly 9 stickers
  for (let i = 0; i < cubeData.length; i++) {
    if (cubeData[i].length !== 9) {
      return { isValid: false, error: `Face ${i + 1} has ${cubeData[i].length} stickers instead of 9` };
    }
  }

  // Check center stickers (5th position, index 4)
  const centers = cubeData.map(face => face[4]);
  const uniqueCenters = new Set(centers);
  
  if (uniqueCenters.size !== 6) {
    return { isValid: false, error: "Duplicate centers detected" };
  }

  // Count occurrences of each color
  const colorCount = {};
  cubeData.forEach(face => {
    face.forEach(color => {
      colorCount[color] = (colorCount[color] || 0) + 1;
    });
  });

  // Check if any color appears more than 9 times
  for (const color in colorCount) {
    if (colorCount[color] > 9) {
      return { isValid: false, error: `Color ${color} appears ${colorCount[color]} times, which is more than 9` };
    }
  }

  return { isValid: true };
}

/**
 * Convert the cube data to the format required by the Kociemba algorithm
 * @param {Array} cubeData - Array of 6 faces, each with 9 stickers
 * @returns {String} - Cube string in the format required by the Kociemba algorithm
 */
function convertToKociembaFormat(cubeData) {
  // Map colors to their positions based on centers
  const colorToFace = {};
  const centerPositions = ['U', 'R', 'F', 'D', 'L', 'B'];
  
  for (let i = 0; i < 6; i++) {
    colorToFace[cubeData[i][4]] = centerPositions[i];
  }
  
  // Reorder the faces to match the expected order: U, R, F, D, L, B
  const reorderedCube = [];
  centerPositions.forEach(pos => {
    const faceColor = Object.keys(colorToFace).find(key => colorToFace[key] === pos);
    const faceIndex = cubeData.findIndex(face => face[4] === faceColor);
    reorderedCube.push([...cubeData[faceIndex]]);
  });
  
  // Convert to string format used by Kociemba: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
  let cubeString = '';
  reorderedCube.forEach(face => {
    face.forEach(color => {
      cubeString += colorToFace[color];
    });
  });
  
  return cubeString;
}

/**
 * Solve the cube using the Kociemba algorithm
 * @param {String} cubeString - Cube string in the format required by the Kociemba algorithm
 * @returns {String} - Solution as a sequence of moves
 */
function solveCube(cubeString) {
  try {
    // Create a temporary file to store the cube state
    fs.writeFileSync('cube_state.txt', cubeString);
    
    // Use the npm package 'rubiks-cube-solver' to solve the cube
    // This is a placeholder - you would need to install the package first
    // npm install rubiks-cube-solver
    const result = execSync('npx cube-solver cube_state.txt').toString().trim();
    
    // Clean up
    fs.unlinkSync('cube_state.txt');
    
    return result;
  } catch (error) {
    console.error('Error solving cube:', error.message);
    return null;
  }
}

/**
 * Main function to solve a Rubik's cube
 * @param {Array} cubeData - Array of 6 faces, each with 9 stickers
 * @returns {Object} - Result with solution or error
 */
function solveRubiksCube(cubeData) {
  // Validate the cube
  const validation = validateCube(cubeData);
  if (!validation.isValid) {
    return { error: validation.error };
  }
  
  // Convert to Kociemba format
  const cubeString = convertToKociembaFormat(cubeData);
  
  // Solve the cube
  const solution = solveCube(cubeString);
  
  if (solution) {
    return { solution };
  } else {
    return { error: "Failed to solve the cube" };
  }
}

// Function to parse command line arguments
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    return null;
  }
  
  try {
    // Check if argument is a file path
    if (args.length === 1 && fs.existsSync(args[0])) {
      const data = fs.readFileSync(args[0], 'utf8');
      return JSON.parse(data);
    }
    
    // Otherwise, treat as a JSON string
    return JSON.parse(args.join(' '));
  } catch (error) {
    console.error('Error parsing command line arguments:', error.message);
    return null;
  }
}

// Main execution
function main() {
  // Example cube configuration (variable-based input)
  const exampleCube = [
    ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'], // Up (white)
    ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'], // Right (red)
    ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'], // Front (green)
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'], // Down (yellow)
    ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'], // Left (orange)
    ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']  // Back (blue)
  ];
  
  // Try to get cube data from command line
  const commandLineCube = parseCommandLineArgs();
  
  // Use command line input if available, otherwise use the example
  const cubeData = commandLineCube || exampleCube;
  
  // Solve the cube
  const result = solveRubiksCube(cubeData);
  
  // Output the result
  if (result.error) {
    console.error('Error:', result.error);
  } else {
    console.log('Solution:', result.solution);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  main();
} else {
  // Export the function if this script is required as a module
  module.exports = { solveRubiksCube };
}