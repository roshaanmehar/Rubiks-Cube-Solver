import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the image paths here (modify these to match your file locations)
const IMAGE_PATHS = [
  path.join(__dirname, 'images', 'white.jpg'),  // Face 1 (white)
  path.join(__dirname, 'images', 'red.jpg'),    // Face 2 (red)
  path.join(__dirname, 'images', 'green.jpg'),  // Face 3 (green)
  path.join(__dirname, 'images', 'yellow.jpg'), // Face 4 (yellow)
  path.join(__dirname, 'images', 'orange.jpg'), // Face 5 (orange)
  path.join(__dirname, 'images', 'blue.jpg')    // Face 6 (blue)
];

// Face order for the final string
const FACE_ORDER = ['w', 'r', 'g', 'y', 'o', 'b']; // white, red, green, yellow, orange, blue

// Output directory for results
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Create images directory if it doesn't exist
const IMAGES_DIR = path.join(__dirname, 'images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`Created images directory: ${IMAGES_DIR}`);
  console.log(`Please place your cube face images in this directory with names: white.jpg, red.jpg, green.jpg, yellow.jpg, orange.jpg, blue.jpg`);
}

// Helper function to convert RGB to HSV
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

// Function to determine the color of a pixel based on HSV values
function determineColor(hsv) {
  // Simple HSV ranges for cube colors
  if (hsv.s < 20 && hsv.v > 70) return 'w'; // white (low saturation, high value)
  if ((hsv.h >= 350 || hsv.h <= 10) && hsv.s > 50) return 'r'; // red
  if (hsv.h >= 90 && hsv.h <= 150 && hsv.s > 40) return 'g'; // green
  if (hsv.h >= 40 && hsv.h <= 70 && hsv.s > 50) return 'y'; // yellow
  if (hsv.h >= 10 && hsv.h <= 40 && hsv.s > 50) return 'o'; // orange
  if (hsv.h >= 180 && hsv.h <= 240 && hsv.s > 40) return 'b'; // blue
  
  // If no match, find the closest color
  const colorRanges = [
    { color: 'w', h: 0, s: 0, v: 100 },
    { color: 'r', h: 0, s: 100, v: 100 },
    { color: 'g', h: 120, s: 100, v: 100 },
    { color: 'y', h: 60, s: 100, v: 100 },
    { color: 'o', h: 30, s: 100, v: 100 },
    { color: 'b', h: 240, s: 100, v: 100 }
  ];
  
  let minDistance = Infinity;
  let closestColor = 'u';
  
  for (const range of colorRanges) {
    // Calculate distance in HSV space
    let hDist = Math.min(Math.abs(hsv.h - range.h), 360 - Math.abs(hsv.h - range.h));
    let sDist = Math.abs(hsv.s - range.s);
    let vDist = Math.abs(hsv.v - range.v);
    
    // Weight the distances (hue is most important)
    const distance = hDist * 1.0 + sDist * 0.8 + vDist * 0.6;
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = range.color;
    }
  }
  
  return closestColor;
}

// Function to process a single cube face image
async function processCubeFace(imagePath, faceIndex) {
  console.log(`Processing face ${faceIndex+1}: ${imagePath}`);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File does not exist: ${imagePath}`);
    }
    
    // Process the image
    const { data, info } = await sharp(imagePath)
      .resize(150, 150, { fit: 'contain' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    
    // Create a 3x3 grid
    const gridSize = 3;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    
    // Array to store colors for each cell
    const cellColors = [];
    
    // Sample each cell in the grid
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Calculate the center of this cell
        const centerX = Math.floor((col + 0.5) * cellWidth);
        const centerY = Math.floor((row + 0.5) * cellHeight);
        
        // Sample a small region around the center
        let rSum = 0, gSum = 0, bSum = 0;
        let sampleCount = 0;
        
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const sx = centerX + dx;
            const sy = centerY + dy;
            
            if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
              const pixelIndex = (sy * width + sx) * 3;
              rSum += data[pixelIndex];
              gSum += data[pixelIndex + 1];
              bSum += data[pixelIndex + 2];
              sampleCount++;
            }
          }
        }
        
        // Calculate average color
        const r = Math.round(rSum / sampleCount);
        const g = Math.round(gSum / sampleCount);
        const b = Math.round(bSum / sampleCount);
        
        // Convert RGB to HSV
        const hsv = rgbToHsv(r, g, b);
        
        // Determine the color
        const color = determineColor(hsv);
        
        // Add to cell colors
        cellColors.push(color);
      }
    }
    
    // Get the center color (which should be the face color)
    const centerColor = cellColors[4]; // Center of 3x3 grid is at index 4
    
    // Count occurrences of each color
    const colorCounts = {};
    for (const color of cellColors) {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
    
    console.log(`Face ${faceIndex+1} colors: ${cellColors.join('')}`);
    console.log(`Face ${faceIndex+1} center color: ${centerColor}`);
    console.log(`Face ${faceIndex+1} color distribution:`, colorCounts);
    
    // Return the cell colors and center color
    return { cellColors, centerColor };
  } catch (error) {
    console.error(`Error processing face ${faceIndex+1}:`, error.message);
    // Return placeholder values
    return { 
      cellColors: Array(9).fill('u'), 
      centerColor: FACE_ORDER[faceIndex] || 'u' 
    };
  }
}

// Main function
async function main() {
  console.log("Simplified Rubik's Cube Face Scanner");
  console.log("===================================");
  
  // Check if the image paths exist
  const existingPaths = [];
  
  for (const imagePath of IMAGE_PATHS) {
    if (fs.existsSync(imagePath)) {
      existingPaths.push(imagePath);
    } else {
      console.warn(`Warning: Image not found: ${imagePath}`);
    }
  }
  
  if (existingPaths.length === 0) {
    console.error("Error: No valid image paths found. Please check the IMAGE_PATHS configuration.");
    return 'wwwwwwwwwrrrrrrrrrgggggggggyyyyyyyyooooooooobbbbbbbbbb';
  }
  
  // Process each face
  const faceResults = [];
  const faceStrings = {};
  
  for (let i = 0; i < existingPaths.length; i++) {
    const { cellColors, centerColor } = await processCubeFace(existingPaths[i], i);
    faceResults.push({ cellColors, centerColor });
    
    // Store the face string by its center color
    faceStrings[centerColor] = cellColors.join('');
  }
  
  // Create the final string in the specified order
  let finalString = '';
  
  for (const color of FACE_ORDER) {
    if (faceStrings[color]) {
      finalString += faceStrings[color];
    } else {
      // If a face is missing, use its color for all 9 stickers
      finalString += color.repeat(9);
      console.warn(`Warning: Face with center color ${color} not found, using placeholder`);
    }
  }
  
  console.log("\nFinal color string:");
  console.log(finalString);
  
  // Save the color string to a file
  try {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'cube_colors.txt'), finalString);
    console.log(`Saved color string to ${path.join(OUTPUT_DIR, 'cube_colors.txt')}`);
  } catch (err) {
    console.error(`Failed to save color string: ${err.message}`);
  }
  
  return finalString;
}

// Run the main function
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});