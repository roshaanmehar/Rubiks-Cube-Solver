// enhanced-cube-solver.js
const fs = require('fs');
// You'll need to install this package first:
// npm install cubejs
const Cube = require('cubejs');

// Define the standard faces and their positions
const FACES = ['U', 'R', 'F', 'D', 'L', 'B']; // Up, Right, Front, Down, Left, Back

// Standard color scheme: White, Red, Green, Yellow, Orange, Blue
const STANDARD_COLORS = {
  'W': 'U', // White on Up
  'R': 'R', // Red on Right
  'G': 'F', // Green on Front
  'Y': 'D', // Yellow on Down
  'O': 'L', // Orange on Left
  'B': 'B'  // Blue on Back
};

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
 * Get the color mapping based on center stickers
 * @param {Array} cubeData - Array of 6 faces, each with 9 stickers
 * @returns {Object} - Mapping from colors to face notations
 */
function getColorMapping(cubeData) {
  const centerColors = {};
  
  // Map the center stickers to their respective faces
  for (let i = 0; i < 6; i++) {
    centerColors[cubeData[i][4]] = FACES[i];
  }
  
  return centerColors;
}

/**
 * Convert the cube data to a facelet string format required by cubejs
 * @param {Array} cubeData - Array of 6 faces, each with 9 stickers
 * @returns {String} - Cube string in the format required by cubejs
 */
function convertToFaceletString(cubeData) {
  // Get color mapping based on center stickers
  const colorMapping = getColorMapping(cubeData);
  console.log('Color mapping:', colorMapping);
  
  // Create the facelet string in the required order: U, R, F, D, L, B
  let faceletString = '';
  
  // Add each face in the standard order
  for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
    const face = cubeData[faceIndex];
    for (let i = 0; i < 9; i++) {
      const color = face[i];
      faceletString += colorMapping[color];
    }
  }
  
  return faceletString;
}

/**
 * Solve the cube using the cubejs library
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
    // Convert to facelet string
    const faceletString = convertToFaceletString(cubeData);
    console.log('Facelet string:', faceletString);
    
    // Initialize the cubejs solver (this only needs to be done once)
    console.log('Initializing solver...');
    Cube.initSolver();
    
    // Create a cube instance from the facelet string
    console.log('Creating cube from facelet string...');
    const cube = Cube.fromString(faceletString);
    
    // Solve the cube
    console.log('Solving cube...');
    const solution = cube.solve();
    
    if (solution) {
      return { 
        solution,
        faceletString
      };
    } else {
      return { error: "Failed to solve the cube" };
    }
  } catch (error) {
    return { error: `Unexpected error: ${error.message}` };
  }
}

/**
 * Parse command line arguments
 * @returns {Array|null} - Cube data from command line or null
 */
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

/**
 * Main execution function
 */
function main() {
  // Example cube configuration (variable-based input)
  // This represents a solved cube with standard color scheme
  const exampleCube = [
    ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'], // Up (white)
    ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'], // Right (red)
    ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'], // Front (green)
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'], // Down (yellow)
    ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'], // Left (orange)
    ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']  // Back (blue)
  ];
  
  // Example of a scrambled cube
  const scrambledExample = [
    ['W', 'R', 'W', 'B', 'W', 'G', 'Y', 'R', 'O'], // Up
    ['R', 'Y', 'B', 'O', 'R', 'W', 'G', 'O', 'Y'], // Right
    ['G', 'B', 'Y', 'R', 'G', 'W', 'O', 'B', 'R'], // Front
    ['Y', 'G', 'O', 'Y', 'Y', 'B', 'W', 'G', 'W'], // Down
    ['O', 'W', 'R', 'G', 'O', 'Y', 'B', 'Y', 'G'], // Left
    ['B', 'O', 'G', 'W', 'B', 'R', 'R', 'B', 'O']  // Back
  ];
  
  // Try to get cube data from command line
  const commandLineCube = parseCommandLineArgs();
  
  // Use command line input if available, otherwise use the example
  const cubeData = commandLineCube || exampleCube;
  
  console.log('Starting Rubik\'s Cube Solver...');
  
  // Solve the cube
  const result = solveRubiksCube(cubeData);
  
  // Output the result
  if (result.error) {
    console.error('Error:', result.error);
  } else {
    console.log('Solution:', result.solution);
    console.log('Solution length:', result.solution.split(' ').length, 'moves');
  }
}

// Create a helper function to apply an algorithm to a cube and get the resulting state
function applyAlgorithm(cube, algorithm) {
  try {
    const newCube = new Cube(cube);
    newCube.move(algorithm);
    return {
      success: true,
      resultCube: newCube
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  main();
} else {
  // Export functions if this script is required as a module
  module.exports = { 
    solveRubiksCube,
    validateCube,
    applyAlgorithm,
    Cube
  };
}