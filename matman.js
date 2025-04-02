import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

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
async function processCubeFaces(imagePaths) {
  const results = [];
  const colorString = [];
  
  console.log("Processing cube faces...");
  
  for (let i = 0; i < imagePaths.length; i++) {
    console.log(`Processing face ${i+1}/${imagePaths.length}: ${imagePaths[i]}`);
    
    try {
      // Read the image file
      const imageBuffer = fs.readFileSync(imagePaths[i]);
      
      // Detect grid centers
      const { gridCenters } = await detectGridCenters(imageBuffer);
      
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

// Function to improve color detection with HSV thresholding
async function detectColorsWithHSV(imageBuffer) {
  // Process the image
  const { width, height, data } = await sharp(imageBuffer)
    .resize(300, 300, { fit: 'contain' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Create HSV image for visualization
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  
  // Convert RGB to HSV for each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const hsv = rgbToHsv(r, g, b);
      
      // Visualize HSV (hue as color)
      const hueColor = hsvToRgb(hsv.h / 360, 1, 1);
      
      const outIdx = (y * width + x) * 4;
      imageData.data[outIdx] = hueColor.r;
      imageData.data[outIdx + 1] = hueColor.g;
      imageData.data[outIdx + 2] = hueColor.b;
      imageData.data[outIdx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Helper function to convert HSV to RGB (for visualization)
function hsvToRgb(h, s, v) {
  let r, g, b;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Function to use contour detection for better grid identification
async function detectCubeGridWithContours(imageBuffer) {
  // This would use contour detection to find the cube grid
  // more accurately than the simple grid division approach
  console.log("Contour detection would be implemented here");
  
  // For demonstration, we'll just return the processed image
  const image = await sharp(imageBuffer)
    .resize(300, 300, { fit: 'contain' })
    .toBuffer();
  
  return image;
}

// Main function
async function main() {
  // Check if image paths are provided as arguments
  const args = process.argv.slice(2);
  let imagePaths = [];
  
  if (args.length >= 6) {
    // Use provided image paths
    imagePaths = args.slice(0, 6);
    console.log("Using provided image paths:", imagePaths);
  } else {
    console.log("No image paths provided. Please provide 6 image paths as arguments.");
    console.log("Example: node cube-scanner.js image1.jpg image2.jpg image3.jpg image4.jpg image5.jpg image6.jpg");
    
    // For testing, you can uncomment this to use sample images if they exist
    /*
    const sampleDir = './sample_images';
    if (fs.existsSync(sampleDir)) {
      imagePaths = fs.readdirSync(sampleDir)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .map(file => path.join(sampleDir, file))
        .slice(0, 6);
      
      if (imagePaths.length < 6) {
        console.log("Not enough sample images found. Please provide 6 image paths.");
        return;
      }
      
      console.log("Using sample images:", imagePaths);
    } else {
      return;
    }
    */
    
    // For testing without real images, create dummy data
    console.log("Generating dummy color string for testing...");
    const dummyString = 'wwwwwwwwwrrrrrrrrrgggggggggyyyyyyyyyooooooooobbbbbbbbb';
    console.log("Dummy color string:", dummyString);
    return dummyString;
  }
  
  // Process the images
  const { colorString } = await processCubeFaces(imagePaths);
  
  console.log("\nFinal color string:");
  console.log(colorString);
  
  return colorString;
}

// Run the main function
main().catch(error => {
  console.error("Error:", error);
});