// rubiks-cube-solver.js
const fs = require('fs');
// You'll need to install this package first:
// npm install cubejs
const Cube = require('cubejs');

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
 * Convert the cube data to a facelet string format required by cubejs
 * @param {Array} cubeData - Array of 6 faces, each with 9 stickers
 * @returns {String} - Cube string in the format required by cubejs
 */
function convertToFaceletString(cubeData) {
  // Define the standard color mapping
  // In cubejs, the facelet string format is: U U U U U U U U U R R R R R R R R R F F F F F F F F F D D D D D D D D D L L L L L L L L L B B B B B B B B B
  // Where U = Up (white), R = Right (red), F = Front (green), D = Down (yellow), L = Left (orange), B = Back (blue)
  
  // First, identify the colors of each center
  const centerColors = {};
  // Standard order of faces in cubejs: U, R, F, D, L, B
  const facePositions = ['U', 'R', 'F', 'D', 'L', 'B'];
  
  for (let i = 0; i < 6; i++) {
    centerColors[cubeData[i][4]] = facePositions[i];
  }
  
  // Now rebuild the facelet string in the required order
  let faceletString = '';
  
  // For each face in the input data
  for (let i = 0; i < 6; i++) {
    const face = cubeData[i];
    for (let j = 0; j < 9; j++) {
      const color = face[j];
      faceletString += centerColors[color];
    }
  }
  
  return faceletString;
}

/**
 * Orient the cube so that white is on top and green is in front
 * @param {String} solution - The solution algorithm
 * @param {Object} centerColors - Mapping of colors to face positions
 * @returns {String} - Reoriented solution
 */
function orientSolution(solution, centerColors) {
  // This is a simplified version - in a real application, you would need to
  // adjust the solution based on the actual orientation of the cube
  return solution;
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
    
    // Initialize the cubejs solver (this only needs to be done once)
    Cube.initSolver();
    
    // Create a cube instance from the facelet string
    const cube = Cube.fromString(faceletString);
    
    // Solve the cube
    const solution = cube.solve();
    
    if (solution) {
      return { solution };
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
  console.log('This may take a moment for initialization...');
  
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