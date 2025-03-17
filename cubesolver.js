// rubiks-cube-solver-cuber.js
const fs = require('fs');
// You'll need to install this package first:
// npm install cuber
const Cube = require('cuber').default;

// Define the faces and their indices
const FACES = {
  U: 0, // Up
  R: 1, // Right
  F: 2, // Front
  D: 3, // Down
  L: 4, // Left
  B: 5  // Back
};

// Define color mapping
const COLOR_TO_FACE = {
  'white': 'U',
  'red': 'R',
  'green': 'F',
  'yellow': 'D',
  'orange': 'L',
  'blue': 'B'
};

// Face indices to notation
const FACE_NOTATION = ['U', 'R', 'F', 'D', 'L', 'B'];

/**
 * Validate the input cube configuration
 * @param {Array} cubeData - Array of 6 faces, each with 9 stickers
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
      return { isValid: false, error: `Face ${i+1} has ${cubeData[i].length} stickers instead of 9` };
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
 * Create a Cube instance from the cube data
 * @param {Array} cubeData - Array of 6 faces, each with 9 stickers
 * @returns {Object} - Cube instance
 */
function createCubeFromData(cubeData) {
  // Create a new default solved cube
  const cube = new Cube();
  
  // Identify the colors of the center stickers
  const centerColors = cubeData.map(face => face[4]);
  
  // Map each color to its corresponding face notation
  const colorMap = {};
  FACE_NOTATION.forEach((notation, index) => {
    colorMap[centerColors[index]] = notation;
  });
  
  // Define the mapping from face indices to sticker positions
  // Each face has 9 stickers arranged in a 3x3 grid
  // We need to map from our 0-8 indices to the notation used by cuber
  const stickerMap = {
    // For each face, map from our indices [0-8] to cuber's notation
    // Format: [our_index]: [cuber_notation]
    0: [0, 0], // top-left
    1: [0, 1], // top-middle
    2: [0, 2], // top-right
    3: [1, 0], // middle-left
    4: [1, 1], // center
    5: [1, 2], // middle-right
    6: [2, 0], // bottom-left
    7: [2, 1], // bottom-middle
    8: [2, 2]  // bottom-right
  };
  
  // Apply the stickers to the cube
  for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
    const face = cubeData[faceIndex];
    const faceNotation = FACE_NOTATION[faceIndex];
    
    for (let stickerIndex = 0; stickerIndex < 9; stickerIndex++) {
      const color = face[stickerIndex];
      const [row, col] = stickerMap[stickerIndex];
      
      // Set the sticker color using cuber's notation
      // This is a simplified approach and may need adjustment based on cuber's API
      cube.setSticker(faceNotation, row, col, colorMap[color]);
    }
  }
  
  return cube;
}

/**
 * Solve the cube using the Kociemba algorithm
 * @param {Object} cube - Cube instance
 * @returns {String} - Solution as a sequence of moves
 */
function solveCube(cube) {
  try {
    // Use cuber's implementation of the Kociemba algorithm
    return cube.solve();
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
  
  try {
    // Create a cube instance from the data
    const cube = createCubeFromData(cubeData);
    
    // Solve the cube
    const solution = solveCube(cube);
    
    if (solution) {
      return { solution };
    } else {
      return { error: "Failed to solve the cube" };
    }
  } catch (error) {
    return { error: `Unexpected error: ${error.message}` };
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
  
  console.log('Solving cube...');
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