/**
 * Rubik's Cube Solver
 * This script takes a representation of a Rubik's cube state and returns a solution.
 * Input format: 6 faces, each with 9 stickers (in reading order: left-to-right, top-to-bottom)
 */

const COLOR_MAP = {
  W: 'white',
  Y: 'yellow',
  R: 'red',
  O: 'orange',
  B: 'blue',
  G: 'green'
};

const FACE_NAMES = ['UP', 'RIGHT', 'FRONT', 'DOWN', 'LEFT', 'BACK'];
const EXPECTED_CENTERS = ['W', 'R', 'G', 'Y', 'O', 'B']; // Expected order: U, R, F, D, L, B

class RubiksCubeSolver {
  constructor() {
    this.faces = [];
    this.faceMap = {};
  }

  /**
   * Parses and validates input from a string
   * @param {string} input - String representation of cube state
   */
  parseInput(input) {
    let faces = [];

    // Parse the input
    try {
      // Remove all whitespace and split by commas or newlines
      const cleanedInput = input.replace(/\s+/g, '');
      
      // Handle different input formats
      if (cleanedInput.includes(',')) {
        // Comma-separated format
        faces = cleanedInput.split(',');
      } else if (cleanedInput.length === 54) {
        // Single string of 54 characters (9 stickers * 6 faces)
        for (let i = 0; i < 6; i++) {
          faces.push(cleanedInput.substring(i * 9, (i + 1) * 9));
        }
      } else {
        // Try to parse as 6 lines of 9 characters each
        faces = cleanedInput.match(/.{9}/g) || [];
      }

      // Convert to uppercase for consistency
      faces = faces.map(face => face.toUpperCase());

      // Validate face count
      if (faces.length !== 6) {
        throw new Error(`Expected 6 faces, got ${faces.length}`);
      }

      // Ensure each face has exactly 9 stickers
      faces.forEach((face, idx) => {
        if (face.length !== 9) {
          throw new Error(`Face ${idx + 1} has ${face.length} stickers instead of 9`);
        }
      });

      this.faces = faces;
    } catch (error) {
      console.error(`Error parsing input: ${error.message}`);
      process.exit(1);
    }

    return this.validateCube();
  }

  /**
   * Validates the cube state
   * @returns {boolean} - Whether the cube state is valid
   */
  validateCube() {
    const allStickers = this.faces.join('');
    
    // Validate centers
    const centers = this.faces.map(face => face[4]); // Center is the 5th sticker (index 4)
    
    // Check for duplicate centers
    const uniqueCenters = new Set(centers);
    if (uniqueCenters.size !== 6) {
      console.error('Error: Duplicate centers detected');
      return false;
    }

    // Validate color counts
    const colorCounts = {};
    for (const char of allStickers) {
      if (!Object.keys(COLOR_MAP).includes(char)) {
        console.error(`Error: Unknown color code '${char}'. Valid codes are: ${Object.keys(COLOR_MAP).join(', ')}`);
        return false;
      }
      colorCounts[char] = (colorCounts[char] || 0) + 1;
    }

    // Each color should appear exactly 9 times
    for (const color of Object.keys(colorCounts)) {
      if (colorCounts[color] !== 9) {
        console.error(`Error: Color '${color}' appears ${colorCounts[color]} times, expected 9`);
        return false;
      }
    }

    // Map faces to standard notation based on centers
    this.mapFaces(centers);
    
    return true;
  }

  /**
   * Maps faces to the standard notation based on centers
   * @param {Array<string>} centers - Array of centers
   */
  mapFaces(centers) {
    // Create a mapping from the input faces to standard order (U, R, F, D, L, B)
    this.faceMap = {};
    
    // First, find the white center (U face)
    const whiteIndex = centers.indexOf('W');
    if (whiteIndex === -1) {
      console.error('Error: No white center found');
      return false;
    }
    this.faceMap['U'] = whiteIndex;
    
    // Then find the green center (F face)
    const greenIndex = centers.indexOf('G');
    if (greenIndex === -1) {
      console.error('Error: No green center found');
      return false;
    }
    this.faceMap['F'] = greenIndex;
    
    // Now determine the other faces based on the orientation
    // In a standard Rubik's cube with white on top and green in front:
    // - Yellow (Y) is opposite to white (DOWN)
    // - Blue (B) is opposite to green (BACK)
    // - Red (R) is RIGHT when white is up and green is front
    // - Orange (O) is LEFT when white is up and green is front
    
    const yellowIndex = centers.indexOf('Y');
    if (yellowIndex === -1) {
      console.error('Error: No yellow center found');
      return false;
    }
    this.faceMap['D'] = yellowIndex;
    
    const blueIndex = centers.indexOf('B');
    if (blueIndex === -1) {
      console.error('Error: No blue center found');
      return false;
    }
    this.faceMap['B'] = blueIndex;
    
    const redIndex = centers.indexOf('R');
    if (redIndex === -1) {
      console.error('Error: No red center found');
      return false;
    }
    this.faceMap['R'] = redIndex;
    
    const orangeIndex = centers.indexOf('O');
    if (orangeIndex === -1) {
      console.error('Error: No orange center found');
      return false;
    }
    this.faceMap['L'] = orangeIndex;
    
    return true;
  }

  /**
   * Generates a facelet string in the format expected by the solver
   * @returns {string} - Facelet string
   */
  generateFaceletString() {
    // Build the facelet string in the order: U, R, F, D, L, B
    let faceletString = '';
    
    // Add each face in the correct order
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
      faceletString += this.faces[this.faceMap[face]];
    }
    
    return faceletString;
  }

  /**
   * Solves the cube using the Kociemba algorithm
   * This is a placeholder for integrating an actual solver
   * @returns {string} - Solution sequence
   */
  solve() {
    const faceletString = this.generateFaceletString();
    console.log(`Generating solution for cube with facelet string: ${faceletString}`);
    
    // This is where you would integrate with an actual solver
    // For example, with the min2phase solver or another implementation
    
    // Placeholder for actual solving logic
    // In a real implementation, you would call the solver algorithm here
    // and return the solution sequence
    
    // Simulate a solution for demonstration purposes
    return this.simulateSolution();
  }

  /**
   * Simulates a solution for demonstration purposes
   * @returns {string} - Simulated solution sequence
   */
  simulateSolution() {
    // This is just a placeholder - in a real implementation, you would use an actual solver
    const moves = ["R", "U", "R'", "U'", "R'", "F", "R2", "U'", "R'", "U'", "R", "U", "R'", "F'"];
    return moves.join(' ');
  }

  /**
   * Pretty-prints the cube state
   */
  printCube() {
    console.log("Cube State:");
    
    const facesInOrder = ['U', 'R', 'F', 'D', 'L', 'B'].map(f => this.faces[this.faceMap[f]]);
    
    // Print the UP face
    console.log("UP:");
    for (let i = 0; i < 3; i++) {
      console.log("  " + facesInOrder[0].substring(i*3, (i+1)*3).split('').join(' '));
    }
    
    // Print the middle faces (LEFT, FRONT, RIGHT, BACK) side by side
    console.log("LEFT, FRONT, RIGHT, BACK:");
    for (let i = 0; i < 3; i++) {
      console.log(
        "  " + facesInOrder[4].substring(i*3, (i+1)*3).split('').join(' ') + 
        "   " + facesInOrder[2].substring(i*3, (i+1)*3).split('').join(' ') + 
        "   " + facesInOrder[1].substring(i*3, (i+1)*3).split('').join(' ') + 
        "   " + facesInOrder[5].substring(i*3, (i+1)*3).split('').join(' ')
      );
    }
    
    // Print the DOWN face
    console.log("DOWN:");
    for (let i = 0; i < 3; i++) {
      console.log("  " + facesInOrder[3].substring(i*3, (i+1)*3).split('').join(' '));
    }
  }
}

/**
 * Main function that runs the solver
 */
function main() {
  const solver = new RubiksCubeSolver();
  let input;

  // Check if input is provided as a command line argument
  if (process.argv.length > 2) {
    // Get input from command line arguments (everything after the script name)
    input = process.argv.slice(2).join(' ');
  } else {
    // Use a predefined example input for demonstration
    // Format: 6 faces (UP, RIGHT, FRONT, DOWN, LEFT, BACK), each with 9 stickers
    // Test case: a solved cube
    input = 'WWWWWWWWW,RRRRRRRRR,GGGGGGGGG,YYYYYYYYY,OOOOOOOOO,BBBBBBBBB';
    console.log("No input provided. Using example of solved cube:");
    console.log(input);
  }

  // Parse and validate the input
  if (solver.parseInput(input)) {
    // Print the cube state for verification
    solver.printCube();
    
    // Solve the cube
    const solution = solver.solve();
    
    console.log("\nSolution:");
    console.log(solution);
    
    // Count the number of moves
    const moveCount = solution.split(' ').length;
    console.log(`\nNumber of moves: ${moveCount}`);
  }
}

// If this script is run directly (not imported), execute the main function
if (require.main === module) {
  main();
} else {
  // Export the solver class for use in other scripts
  module.exports = RubiksCubeSolver;
}

// Example of how to use the solver as a module:
/*
const RubiksCubeSolver = require('./rubiks-cube-solver.js');
const solver = new RubiksCubeSolver();
const input = 'WWWWWWWWW,RRRRRRRRR,GGGGGGGGG,YYYYYYYYY,OOOOOOOOO,BBBBBBBBB';
if (solver.parseInput(input)) {
  const solution = solver.solve();
  console.log(solution);
}
*/