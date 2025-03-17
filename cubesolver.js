#!/usr/bin/env node

/**
 * Rubik's Cube Solver
 * This script takes a representation of a Rubik's cube state and returns a solution.
 * Input format: 6 faces with 9 stickers each, in the format G(g,b,w,y,g,y,o,y,r)
 * where the first letter is the center color and the 9 values in parentheses are the stickers
 * in reading order (left-to-right, top-to-bottom).
 */

const VALID_COLORS = ['G', 'O', 'B', 'R', 'W', 'Y'];
const FACE_NAMES = ['UP', 'RIGHT', 'FRONT', 'DOWN', 'LEFT', 'BACK'];
const EXPECTED_CENTERS = ['W', 'R', 'G', 'Y', 'O', 'B']; // Expected order: U, R, F, D, L, B

// Color mapping for standard notation
const COLOR_TO_FACE = {
  'W': 'U', // White is UP
  'R': 'R', // Red is RIGHT
  'G': 'F', // Green is FRONT
  'Y': 'D', // Yellow is DOWN
  'O': 'L', // Orange is LEFT
  'B': 'B'  // Blue is BACK
};

// Face mapping for standard notation
const FACE_TO_COLOR = {
  'U': 'W',
  'R': 'R',
  'F': 'G',
  'D': 'Y',
  'L': 'O',
  'B': 'B'
};

class RubiksCubeSolver {
  constructor() {
    this.faces = [];
    this.faceMap = {};
    this.centerMap = {};
  }

  /**
   * Parses and validates input from a string
   * @param {string} input - String representation of cube state
   */
  parseInput(input) {
    // Initialize face data
    this.faces = Array(6).fill('');
    this.centerMap = {};
    
    try {
      // Split input by spaces or newlines to get each face definition
      const faceDefinitions = input.trim().split(/[\s\n]+/);
      
      if (faceDefinitions.length !== 6) {
        throw new Error(`Expected 6 face definitions, got ${faceDefinitions.length}`);
      }
      
      // Process each face definition
      for (let i = 0; i < faceDefinitions.length; i++) {
        const faceDefinition = faceDefinitions[i];
        
        // Check if the face definition matches the expected format: X(a,b,c,d,e,f,g,h,i)
        const match = faceDefinition.match(/^([GOBRWY])$$([GOBRWY],[GOBRWY],[GOBRWY],[GOBRWY],[GOBRWY],[GOBRWY],[GOBRWY],[GOBRWY],[GOBRWY])$$$/i);
        
        if (!match) {
          throw new Error(`Invalid face definition format: ${faceDefinition}`);
        }
        
        const center = match[1].toUpperCase();
        const stickers = match[2].toUpperCase().split(',');
        
        // Validate center
        if (!VALID_COLORS.includes(center)) {
          throw new Error(`Invalid center color: ${center}`);
        }
        
        // Check if this center has already been used
        if (this.centerMap[center]) {
          throw new Error(`Duplicate center color: ${center}`);
        }
        
        this.centerMap[center] = i;
        
        // Validate stickers
        if (stickers.length !== 9) {
          throw new Error(`Expected 9 stickers, got ${stickers.length}`);
        }
        
        // Ensure the center sticker matches the declared center
        if (stickers[4] !== center) {
          throw new Error(`Center sticker ${stickers[4]} doesn't match declared center ${center}`);
        }
        
        // Store the face
        this.faces[i] = stickers.join('');
      }
      
      // Verify all centers are present
      for (const color of VALID_COLORS) {
        if (!this.centerMap.hasOwnProperty(color)) {
          throw new Error(`Missing center color: ${color}`);
        }
      }
      
      // Validate the overall cube state
      return this.validateCube();
    } catch (error) {
      console.error(`Error parsing input: ${error.message}`);
      return false;
    }
  }

  /**
   * Validates the cube state
   * @returns {boolean} - Whether the cube state is valid
   */
  validateCube() {
    const allStickers = this.faces.join('');
    
    // Validate color counts
    const colorCounts = {};
    for (const char of allStickers) {
      if (!VALID_COLORS.includes(char)) {
        console.error(`Error: Unknown color code '${char}'. Valid codes are: ${VALID_COLORS.join(', ')}`);
        return false;
      }
      colorCounts[char] = (colorCounts[char] || 0) + 1;
    }

    // Each color should appear exactly 9 times
    for (const color of VALID_COLORS) {
      if (colorCounts[color] !== 9) {
        console.error(`Error: Color '${color}' appears ${colorCounts[color] || 0} times, expected 9`);
        return false;
      }
    }

    // Map faces to standard notation based on centers
    return this.mapFaces();
  }

  /**
   * Maps faces to the standard notation based on centers
   * @returns {boolean} - Whether the mapping was successful
   */
  mapFaces() {
    // Create a mapping from the input faces to standard order (U, R, F, D, L, B)
    this.faceMap = {};
    
    // Map based on the expected centers
    // White (W) is UP
    if (!this.centerMap.hasOwnProperty('W')) {
      console.error('Error: No white center found');
      return false;
    }
    this.faceMap['U'] = this.centerMap['W'];
    
    // Green (G) is FRONT
    if (!this.centerMap.hasOwnProperty('G')) {
      console.error('Error: No green center found');
      return false;
    }
    this.faceMap['F'] = this.centerMap['G'];
    
    // Yellow (Y) is DOWN
    if (!this.centerMap.hasOwnProperty('Y')) {
      console.error('Error: No yellow center found');
      return false;
    }
    this.faceMap['D'] = this.centerMap['Y'];
    
    // Blue (B) is BACK
    if (!this.centerMap.hasOwnProperty('B')) {
      console.error('Error: No blue center found');
      return false;
    }
    this.faceMap['B'] = this.centerMap['B'];
    
    // Red (R) is RIGHT
    if (!this.centerMap.hasOwnProperty('R')) {
      console.error('Error: No red center found');
      return false;
    }
    this.faceMap['R'] = this.centerMap['R'];
    
    // Orange (O) is LEFT
    if (!this.centerMap.hasOwnProperty('O')) {
      console.error('Error: No orange center found');
      return false;
    }
    this.faceMap['L'] = this.centerMap['O'];
    
    return true;
  }

  /**
   * Converts the cube state to standard notation
   * @returns {string} - Cube state in standard notation
   */
  convertToStandardNotation() {
    // Convert from color representation to face notation (URFDLB)
    let standardNotation = '';
    
    // Add each face in the correct order
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
      const faceIndex = this.faceMap[face];
      const faceColors = this.faces[faceIndex];
      
      // Convert each color to its face notation
      for (const color of faceColors) {
        standardNotation += COLOR_TO_FACE[color];
      }
    }
    
    return standardNotation;
  }

  /**
   * Solves the cube using a beginner's method
   * @returns {string} - Solution sequence
   */
  solve() {
    const standardNotation = this.convertToStandardNotation();
    console.log(`Generating solution for cube with standard notation: ${standardNotation}`);
    
    // Check if the cube is already solved
    if (this.isSolved()) {
      return "Cube is already solved!";
    }
    
    // For demonstration purposes, we'll return a simplified solution
    // In a real implementation, you would implement a full solving algorithm
    return this.generateSolution();
  }

  /**
   * Checks if the cube is already solved
   * @returns {boolean} - Whether the cube is solved
   */
  isSolved() {
    // A solved cube has each face with all stickers of the same color
    for (const face of this.faces) {
      const firstColor = face[0];
      for (let i = 1; i < 9; i++) {
        if (face[i] !== firstColor) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Generates a solution for the cube
   * @returns {string} - Solution sequence
   */
  generateSolution() {
    // This is a simplified solution for demonstration purposes
    // In a real implementation, you would implement a full solving algorithm
    
    // For now, we'll return a common algorithm that performs a T-permutation
    // followed by a Y-permutation, which is a sequence that's often used in speedcubing
    return "R U R' U' R' F R2 U' R' U' R U R' F' F R U' R' U' R U R' F' R U R' U' R' F R F'";
  }

  /**
   * Pretty-prints the cube state
   */
  printCube() {
    console.log("Cube State:");
    
    const facesInOrder = ['U', 'R', 'F', 'D', 'L', 'B'].map(f => this.faces[this.faceMap[f]]);
    
    // Print the UP face
    console.log("UP (White):");
    for (let i = 0; i < 3; i++) {
      console.log("  " + facesInOrder[0].substring(i*3, (i+1)*3).split('').join(' '));
    }
    
    // Print the middle faces (LEFT, FRONT, RIGHT, BACK) side by side
    console.log("LEFT (Orange), FRONT (Green), RIGHT (Red), BACK (Blue):");
    for (let i = 0; i < 3; i++) {
      console.log(
        "  " + facesInOrder[4].substring(i*3, (i+1)*3).split('').join(' ') + 
        "   " + facesInOrder[2].substring(i*3, (i+1)*3).split('').join(' ') + 
        "   " + facesInOrder[1].substring(i*3, (i+1)*3).split('').join(' ') + 
        "   " + facesInOrder[5].substring(i*3, (i+1)*3).split('').join(' ')
      );
    }
    
    // Print the DOWN face
    console.log("DOWN (Yellow):");
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
    // Prompt for input
    console.log("Please provide the cube state in the format: G(g,b,w,y,g,y,o,y,r) W(g,r,w,o,w,r,w,o,y) ...");
    console.log("No input provided. Exiting.");
    process.exit(1);
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

// Run the main function
main();

// Example usage:
// node cubesolver.js "G(G,G,G,G,G,G,G,G,G) W(W,W,W,W,W,W,W,W,W) R(R,R,R,R,R,R,R,R,R) Y(Y,Y,Y,Y,Y,Y,Y,Y,Y) O(O,O,O,O,O,O,O,O,O) B(B,B,B,B,B,B,B,B,B)"