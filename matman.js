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

// Improved function to determine the color using only RGB values
function determineColorByRGB(r, g, b) {
  // Define standard RGB values for Rubik's cube colors
  const colorReferences = [
    { color: 'w', r: 255, g: 255, b: 255 }, // White
    { color: 'y', r: 255, g: 255, b: 0 },   // Yellow
    { color: 'r', r: 255, g: 0, b: 0 },     // Red
    { color: 'o', r: 255, g: 165, b: 0 },   // Orange
    { color: 'g', r: 0, g: 255, b: 0 },     // Green
    { color: 'b', r: 0, g: 0, b: 255 }      // Blue
  ];
  
  // White detection - high values in all channels
  if (r > 200 && g > 200 && b > 200) {
    return 'w';
  }
  
  // Yellow detection - high red and green, low blue
  if (r > 180 && g > 180 && b < 100) {
    return 'y';
  }
  
  // Red detection - high red, low green and blue
  if (r > 150 && g < 100 && b < 100) {
    return 'r';
  }
  
  // Orange detection - high red, medium green, low blue
  if (r > 180 && g > 80 && g < 180 && b < 80) {
    return 'o';
  }
  
  // Green detection - low red, high green, low blue
  if (r < 100 && g > 150 && b < 100) {
    return 'g';
  }
  
  // Blue detection - low red, low green, high blue
  if (r < 100 && g < 100 && b > 150) {
    return 'b';
  }
  
  // If no direct match, calculate the Euclidean distance in RGB space
  let minDistance = Infinity;
  let closestColor = 'u'; // unknown as default
  
  for (const ref of colorReferences) {
    const distance = Math.sqrt(
      Math.pow(r - ref.r, 2) + 
      Math.pow(g - ref.g, 2) + 
      Math.pow(b - ref.b, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = ref.color;
    }
  }
  
  // Additional checks to resolve common confusions
  
  // Orange vs Red clarification (orange has more green)
  if (closestColor === 'r' && g > 80) {
    return 'o';
  }
  
  // Yellow vs White clarification (yellow has less blue)
  if (closestColor === 'w' && b < 150 && r > 180 && g > 180) {
    return 'y';
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
      .resize(300, 300, { fit: 'contain' }) // Increased resolution for better analysis
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
    
    // Generate a debug image with sampled points
    const debugPixels = Buffer.from(data);
    
    // Sample each cell in the grid
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Calculate the center of this cell
        const centerX = Math.floor((col + 0.5) * cellWidth);
        const centerY = Math.floor((row + 0.5) * cellHeight);
        
        // Use a larger sampling area for more accurate color detection
        const sampleSize = 5;
        let rSum = 0, gSum = 0, bSum = 0;
        let sampleCount = 0;
        
        for (let dy = -sampleSize; dy <= sampleSize; dy++) {
          for (let dx = -sampleSize; dx <= sampleSize; dx++) {
            const sx = centerX + dx;
            const sy = centerY + dy;
            
            if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
              const pixelIndex = (sy * width + sx) * 3;
              rSum += data[pixelIndex];
              gSum += data[pixelIndex + 1];
              bSum += data[pixelIndex + 2];
              sampleCount++;
              
              // Mark the sampled pixels in the debug image (as blue dots)
              if (dx === 0 && dy === 0) {
                // Mark center in red
                debugPixels[pixelIndex] = 255;
                debugPixels[pixelIndex + 1] = 0;
                debugPixels[pixelIndex + 2] = 0;
              }
            }
          }
        }
        
        // Calculate average color
        const r = Math.round(rSum / sampleCount);
        const g = Math.round(gSum / sampleCount);
        const b = Math.round(bSum / sampleCount);
        
        // Determine the color using only RGB
        const color = determineColorByRGB(r, g, b);
        
        // Add to cell colors
        cellColors.push(color);
        
        // Output debug info
        console.log(`Cell [${row},${col}]: RGB(${r},${g},${b}) -> ${color}`);
      }
    }
    
    // Save debug image
    const debugOutputPath = path.join(OUTPUT_DIR, `debug_face_${faceIndex+1}.png`);
    await sharp(debugPixels, { raw: { width, height, channels: 3 } })
      .png()
      .toFile(debugOutputPath);
    console.log(`Saved debug image to ${debugOutputPath}`);
    
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
  console.log("RGB-Based Rubik's Cube Face Scanner");
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
    
    // Also output a human-readable version
    const readableVersion = `
White face: ${faceStrings['w'] || 'missing'}
Red face: ${faceStrings['r'] || 'missing'}
Green face: ${faceStrings['g'] || 'missing'}
Yellow face: ${faceStrings['y'] || 'missing'}
Orange face: ${faceStrings['o'] || 'missing'}
Blue face: ${faceStrings['b'] || 'missing'}
    `;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'cube_colors_readable.txt'), readableVersion);
    console.log(`Saved human-readable version to ${path.join(OUTPUT_DIR, 'cube_colors_readable.txt')}`);
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