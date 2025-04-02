import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import fetch from 'node:fetch';

// Configuration
const CUBE_FACES = ['white', 'red', 'green', 'yellow', 'orange', 'blue'];
const FACE_COLORS = {
  'white': { h: [0, 180], s: [0, 30], v: [80, 100] },
  'red': { h: [355, 10], s: [70, 100], v: [50, 100] },
  'green': { h: [90, 150], s: [40, 100], v: [30, 100] },
  'yellow': { h: [40, 70], s: [70, 100], v: [70, 100] },
  'orange': { h: [10, 30], s: [70, 100], v: [70, 100] },
  'blue': { h: [180, 240], s: [40, 100], v: [30, 100] }
};

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
  for (const [color, range] of Object.entries(FACE_COLORS)) {
    // Handle red's special case (wraps around 0/360)
    if (color === 'red' && (hsv.h >= range.h[0] || hsv.h <= range.h[1])) {
      if (hsv.s >= range.s[0] && hsv.s <= range.s[1] && 
          hsv.v >= range.v[0] && hsv.v <= range.v[1]) {
        return color[0]; // Return first letter of color
      }
    } 
    // Normal case for other colors
    else if (hsv.h >= range.h[0] && hsv.h <= range.h[1]) {
      if (hsv.s >= range.s[0] && hsv.s <= range.s[1] && 
          hsv.v >= range.v[0] && hsv.v <= range.v[1]) {
        return color[0]; // Return first letter of color
      }
    }
  }
  return 'u'; // Unknown color
}

// Function to detect grid centers in an image
async function detectGridCenters(imageBuffer) {
  // Process the image
  const { width, height, data } = await sharp(imageBuffer)
    .resize(300, 300, { fit: 'contain' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create a canvas for visualization (optional)
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  
  // Copy the image data to the canvas
  for (let i = 0; i < data.length; i++) {
    imageData.data[i] = data[i];
  }
  ctx.putImageData(imageData, 0, 0);

  // Calculate grid positions (3x3 grid)
  const gridSize = 3;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  // Sample points at the center of each grid cell
  const gridCenters = [];
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const centerX = Math.floor((col + 0.5) * cellWidth);
      const centerY = Math.floor((row + 0.5) * cellHeight);
      
      // Get the pixel at the center
      const pixelIndex = (centerY * width + centerX) * 3;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      
      // Convert RGB to HSV
      const hsv = rgbToHsv(r, g, b);
      
      // Determine the color
      const color = determineColor(hsv);
      
      // Add to grid centers
      gridCenters.push({
        position: { x: centerX, y: centerY },
        rgb: { r, g, b },
        hsv,
        color
      });
      
      // Draw a circle at the center (for visualization)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.strokeStyle = 'black';
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // Add color label
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText(color, centerX - 3, centerY + 4);
    }
  }
  
  return { gridCenters, canvas };
}

// Function to process multiple cube face images
async function processCubeFaces(imageUrls) {
  const results = [];
  const colorString = [];
  
  console.log("Processing cube faces...");
  
  for (let i = 0; i < imageUrls.length; i++) {
    console.log(`Processing face ${i+1}/${imageUrls.length}...`);
    
    try {
      // Fetch the image
      const response = await fetch(imageUrls[i]);
      const imageBuffer = await response.arrayBuffer();
      
      // Detect grid centers
      const { gridCenters } = await detectGridCenters(Buffer.from(imageBuffer));
      
      // Add to results
      results.push(gridCenters);
      
      // Add colors to the string
      const faceColors = gridCenters.map(center => center.color);
      colorString.push(...faceColors);
      
      console.log(`Face ${i+1} colors: ${faceColors.join('')}`);
    } catch (error) {
      console.error(`Error processing face ${i+1}:`, error.message);
    }
  }
  
  return {
    results,
    colorString: colorString.join('')
  };
}

// Function to improve color detection with calibration
function calibrateColorRanges(calibrationImage, knownColors) {
  // This would analyze a calibration image with known colors
  // to adjust the HSV ranges for better detection
  console.log("Color calibration would be implemented here");
  // For now, we'll use the predefined ranges
}

// Function to use contour detection for better grid identification
async function detectCubeGridWithContours(imageBuffer) {
  // This would use contour detection to find the cube grid
  // more accurately than the simple grid division approach
  console.log("Contour detection would be implemented here");
  // For now, we'll use the simple grid approach
}

// Main function
async function main() {
  // Example image URLs - replace these with your actual cube face images
  const imageUrls = [
    'https://example.com/cube_white.jpg',
    'https://example.com/cube_red.jpg',
    'https://example.com/cube_green.jpg',
    'https://example.com/cube_yellow.jpg',
    'https://example.com/cube_orange.jpg',
    'https://example.com/cube_blue.jpg'
  ];
  
  // For testing with placeholder images
  const placeholderUrls = Array(6).fill('https://picsum.photos/300/300');
  
  console.log("Starting cube face detection...");
  
  // Process the images
  const { colorString } = await processCubeFaces(placeholderUrls);
  
  console.log("\nFinal color string:");
  console.log(colorString);
  
  // The expected format is:
  // wwwwwwwwwrrrrrrrrrgggggggggyyyyyyyyyooooooooobbbbbbbbb
  
  return colorString;
}

// Run the main function
main().catch(error => {
  console.error("Error:", error);
});