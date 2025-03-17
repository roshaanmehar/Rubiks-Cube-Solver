#!/usr/bin/env node

/**
 * Rubik's Cube Solver
 * This script takes a representation of a Rubik's cube state and returns a solution.
 * Input format: 6 faces with 9 stickers each, in the format G(g,b,w,y,g,y,o,y,r)
 * where the first letter is the center color and the 9 values in parentheses are the stickers
 * in reading order (left-to-right, top-to-bottom).
 */

// Import the Kociemba algorithm for solving the cube
import { solve } from '@laur89/kociemba';

const VALID_COLORS = ['G', 'O', 'B', 'R', 'W', 'Y'];
const FACE_NAMES = ['UP', 'RIGHT', 'FRONT', 'DOWN', 'LEFT', 'BACK'];
const EXPECTED_CENTERS = ['W', 'R', 'G', 'Y', 'O', 'B']; // Expected order: U, R, F, D, L, B

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
   * @returns {Promise<string>} - Solution sequence
   */
  async solve() {
    const faceletString = this.generateFaceletString();
    console.log(`Generating solution for cube with facelet string: ${faceletString}`);
    
    try {
      // Use the Kociemba algorithm to solve the cube
      const solution = await solve(faceletString);
      return solution;
    } catch (error) {
      console.error(`Error solving cube: ${error.message}`);
      return "Error: Failed to solve the cube";
    }
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
async function main() {
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
    const solution = await solver.solve();
    
    console.log("\nSolution:");
    console.log(solution);
    
    // Count the number of moves
    const moveCount = solution.split(' ').length;
    console.log(`\nNumber of moves: ${moveCount}`);
  }
}

// If this script is run directly (not imported), execute the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Example usage:
// node cubesolver.js "G(G,G,G,G,G,G,G,G,G) W(W,W,W,W,W,W,W,W,W) R(R,R,R,R,R,R,R,R,R) Y(Y,Y,Y,Y,Y,Y,Y,Y,Y) O(O,O,O,O,O,O,O,O,O) B(B,B,B,B,B,B,B,B,B)"