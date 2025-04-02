import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CUBE_FACES = ['white', 'red', 'green', 'yellow', 'orange', 'blue'];
const FACE_COLORS = {
  'white': { h: [0, 180], s: [0, 30], v: [80, 100], letter: 'w' },
  'red': { h: [355, 10], s: [70, 100], v: [50, 100], letter: 'r' },
  'green': { h: [90, 150], s: [40, 100], v: [30, 100], letter: 'g' },
  'yellow': { h: [40, 70], s: [70, 100], v: [70, 100], letter: 'y' },
  'orange': { h: [10, 30], s: [70, 100], v: [70, 100], letter: 'o' },
  'blue': { h: [180, 240], s: [40, 100], v: [30, 100], letter: 'b' }
};

// Output directory for debug images
const OUTPUT_DIR = path.join(__dirname, 'output');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error(`Failed to create output directory: ${err.message}`);
  }
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

// Helper function to convert HSV to RGB (for visualization)
function hsvToRgb(h, s, v) {
  h = h / 360;
  s = s / 100;
  v = v / 100;
  
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

// Function to determine the color of a pixel based on HSV values
function determineColor(hsv, calibratedRanges = null) {
  const ranges = calibratedRanges || FACE_COLORS;
  
  // First check for white (low saturation, high value)
  if (hsv.s < ranges.white.s[1] && hsv.v > ranges.white.v[0]) {
    return ranges.white.letter;
  }
  
  // Check for other colors
  for (const [color, range] of Object.entries(ranges)) {
    if (color === 'white') continue; // Already checked
    
    // Handle red's special case (wraps around 0/360)
    if (color === 'red') {
      if ((hsv.h >= range.h[0] || hsv.h <= range.h[1]) &&
          hsv.s >= range.s[0] && hsv.s <= range.s[1] && 
          hsv.v >= range.v[0] && hsv.v <= range.v[1]) {
        return range.letter;
      }
    } 
    // Normal case for other colors
    else if (hsv.h >= range.h[0] && hsv.h <= range.h[1] &&
             hsv.s >= range.s[0] && hsv.s <= range.s[1] && 
             hsv.v >= range.v[0] && hsv.v <= range.v[1]) {
      return range.letter;
    }
  }
  
  // If no match, find the closest color
  let minDistance = Infinity;
  let closestColor = 'u';
  
  for (const [color, range] of Object.entries(ranges)) {
    // Calculate distance in HSV space
    let hDist;
    if (color === 'red' && (hsv.h > 270 || hsv.h < 90)) {
      // Special case for red (wraps around)
      hDist = Math.min(
        Math.abs(hsv.h - range.h[0]),
        Math.abs(hsv.h - range.h[1] - 360)
      );
    } else {
      // Normal case
      const hMid = (range.h[0] + range.h[1]) / 2;
      hDist = Math.abs(hsv.h - hMid);
    }
    
    const sMid = (range.s[0] + range.s[1]) / 2;
    const vMid = (range.v[0] + range.v[1]) / 2;
    
    const sDist = Math.abs(hsv.s - sMid);
    const vDist = Math.abs(hsv.v - vMid);
    
    // Weight the distances (hue is most important)
    const distance = hDist * 1.0 + sDist * 0.8 + vDist * 0.6;
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = range.letter;
    }
  }
  
  return closestColor;
}

// Function to detect grid centers in an image using adaptive methods
async function detectGridCenters(imageBuffer, faceIndex, calibratedRanges = null) {
  // Process the image
  const { width, height, data } = await sharp(imageBuffer)
    .resize(300, 300, { fit: 'contain' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create a canvas for visualization
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  
  // Copy the image data to the canvas
  for (let i = 0; i < data.length; i++) {
    imageData.data[i] = data[i];
  }
  ctx.putImageData(imageData, 0, 0);

  // Try to detect the cube grid using edge detection
  // For simplicity, we'll use a fixed 3x3 grid for now
  const gridSize = 3;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  // Sample points at the center of each grid cell
  const gridCenters = [];
  const colorCounts = {};
  
  // Initialize color counts
  for (const color of Object.values(FACE_COLORS)) {
    colorCounts[color.letter] = 0;
  }
  
  // Create an HSV visualization canvas
  const hsvCanvas = createCanvas(width, height);
  const hsvCtx = hsvCanvas.getContext('2d');
  const hsvImageData = hsvCtx.createImageData(width, height);
  
  // Convert the entire image to HSV for visualization
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const hsv = rgbToHsv(r, g, b);
      const color = determineColor(hsv, calibratedRanges);
      
      // Visualize the HSV-based color classification
      let displayColor;
      switch (color) {
        case 'w': displayColor = { r: 255, g: 255, b: 255 }; break;
        case 'r': displayColor = { r: 255, g: 0, b: 0 }; break;
        case 'g': displayColor = { r: 0, g: 255, b: 0 }; break;
        case 'y': displayColor = { r: 255, g: 255, b: 0 }; break;
        case 'o': displayColor = { r: 255, g: 165, b: 0 }; break;
        case 'b': displayColor = { r: 0, g: 0, b: 255 }; break;
        default: displayColor = { r: 128, g: 128, b: 128 }; break;
      }
      
      const outIdx = (y * width + x) * 4;
      hsvImageData.data[outIdx] = displayColor.r;
      hsvImageData.data[outIdx + 1] = displayColor.g;
      hsvImageData.data[outIdx + 2] = displayColor.b;
      hsvImageData.data[outIdx + 3] = 255;
    }
  }
  
  hsvCtx.putImageData(hsvImageData, 0, 0);
  
  // Save the HSV visualization
  try {
    const hsvBuffer = hsvCanvas.toBuffer('image/png');
    fs.writeFileSync(path.join(OUTPUT_DIR, `face${faceIndex+1}_hsv.png`), hsvBuffer);
    console.log(`Saved HSV visualization for face ${faceIndex+1}`);
  } catch (err) {
    console.error(`Failed to save HSV visualization: ${err.message}`);
  }
  
  // Sample the grid centers
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Calculate the center of this cell
      const centerX = Math.floor((col + 0.5) * cellWidth);
      const centerY = Math.floor((row + 0.5) * cellHeight);
      
      // Sample a 5x5 region around the center for more robust color detection
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
      const color = determineColor(hsv, calibratedRanges);
      colorCounts[color] = (colorCounts[color] || 0) + 1;
      
      // Add to grid centers
      gridCenters.push({
        position: { x: centerX, y: centerY },
        rgb: { r, g, b },
        hsv,
        color
      });
      
      // Draw a circle at the center
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Fill with the detected color
      let fillStyle;
      switch (color) {
        case 'w': fillStyle = 'white'; break;
        case 'r': fillStyle = 'red'; break;
        case 'g': fillStyle = 'green'; break;
        case 'y': fillStyle = 'yellow'; break;
        case 'o': fillStyle = 'orange'; break;
        case 'b': fillStyle = 'blue'; break;
        default: fillStyle = 'gray'; break;
      }
      ctx.fillStyle = fillStyle;
      ctx.fill();
      
      // Add color label
      ctx.font = '16px Arial';
      ctx.fillStyle = (color === 'w') ? 'black' : 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(color, centerX, centerY);
    }
  }
  
  // Validate the detected colors
  const colorDistribution = Object.entries(colorCounts)
    .filter(([color, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  console.log(`Face ${faceIndex+1} color distribution:`, colorDistribution);
  
  // Check if we have a dominant color (expected for a cube face)
  if (colorDistribution.length > 0 && colorDistribution[0][1] >= 5) {
    const dominantColor = colorDistribution[0][0];
    console.log(`Face ${faceIndex+1} dominant color: ${dominantColor}`);
    
    // Draw the dominant color in the corner
    ctx.fillStyle = (() => {
      switch (dominantColor) {
        case 'w': return 'white';
        case 'r': return 'red';
        case 'g': return 'green';
        case 'y': return 'yellow';
        case 'o': return 'orange';
        case 'b': return 'blue';
        default: return 'gray';
      }
    })();
    ctx.fillRect(0, 0, 30, 30);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(0, 0, 30, 30);
    
    ctx.fillStyle = (dominantColor === 'w') ? 'black' : 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dominantColor, 15, 15);
  }
  
  // Save the visualization
  try {
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(OUTPUT_DIR, `face${faceIndex+1}_grid.png`), buffer);
    console.log(`Saved grid visualization for face ${faceIndex+1}`);
  } catch (err) {
    console.error(`Failed to save grid visualization: ${err.message}`);
  }
  
  return { gridCenters, canvas, colorDistribution };
}

// Function to calibrate color ranges based on a set of sample images
async function calibrateColorRanges(calibrationImages) {
  console.log("Calibrating color ranges...");
  
  if (!calibrationImages || calibrationImages.length === 0) {
    console.log("No calibration images provided, using default ranges");
    return FACE_COLORS;
  }
  
  // Create a copy of the default ranges
  const calibratedRanges = JSON.parse(JSON.stringify(FACE_COLORS));
  
  // Process each calibration image
  for (let i = 0; i < calibrationImages.length; i++) {
    try {
      console.log(`Processing calibration image ${i+1}/${calibrationImages.length}`);
      
      // Read the image
      const imageBuffer = fs.readFileSync(calibrationImages[i]);
      
      // Process the image
      const { width, height, data } = await sharp(imageBuffer)
        .resize(300, 300, { fit: 'contain' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Sample the image to collect color data
      const colorSamples = {};
      
      // Initialize color samples
      for (const color of Object.keys(FACE_COLORS)) {
        colorSamples[color] = [];
      }
      
      // Sample the image
      for (let y = 0; y < height; y += 10) {
        for (let x = 0; x < width; x += 10) {
          const idx = (y * width + x) * 3;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          const hsv = rgbToHsv(r, g, b);
          
          // Determine which color this pixel is closest to
          let minDistance = Infinity;
          let closestColor = null;
          
          for (const [color, range] of Object.entries(FACE_COLORS)) {
            // Calculate distance in HSV space
            let hDist;
            if (color === 'red' && (hsv.h > 270 || hsv.h < 90)) {
              // Special case for red (wraps around)
              hDist = Math.min(
                Math.abs(hsv.h - range.h[0]),
                Math.abs(hsv.h - range.h[1] - 360)
              );
            } else {
              // Normal case
              const hMid = (range.h[0] + range.h[1]) / 2;
              hDist = Math.abs(hsv.h - hMid);
            }
            
            const sMid = (range.s[0] + range.s[1]) / 2;
            const vMid = (range.v[0] + range.v[1]) / 2;
            
            const sDist = Math.abs(hsv.s - sMid);
            const vDist = Math.abs(hsv.v - vMid);
            
            // Weight the distances
            const distance = hDist * 1.0 + sDist * 0.8 + vDist * 0.6;
            
            if (distance < minDistance) {
              minDistance = distance;
              closestColor = color;
            }
          }
          
          // Add to samples if the distance is reasonable
          if (minDistance < 100) {
            colorSamples[closestColor].push(hsv);
          }
        }
      }
      
      // Update the calibrated ranges based on the samples
      for (const [color, samples] of Object.entries(colorSamples)) {
        if (samples.length > 10) {
          // Calculate statistics
          const hValues = samples.map(hsv => hsv.h);
          const sValues = samples.map(hsv => hsv.s);
          const vValues = samples.map(hsv => hsv.v);
          
          // Calculate mean and standard deviation
          const hMean = hValues.reduce((sum, val) => sum + val, 0) / hValues.length;
          const sMean = sValues.reduce((sum, val) => sum + val, 0) / sValues.length;
          const vMean = vValues.reduce((sum, val) => sum + val, 0) / vValues.length;
          
          const hStdDev = Math.sqrt(hValues.reduce((sum, val) => sum + Math.pow(val - hMean, 2), 0) / hValues.length);
          const sStdDev = Math.sqrt(sValues.reduce((sum, val) => sum + Math.pow(val - sMean, 2), 0) / sValues.length);
          const vStdDev = Math.sqrt(vValues.reduce((sum, val) => sum + Math.pow(val - vMean, 2), 0) / vValues.length);
          
          // Update ranges (mean ± 2 standard deviations)
          if (color === 'red') {
            // Special case for red (wraps around 0/360)
            if (hMean > 270) {
              calibratedRanges[color].h = [hMean - 2 * hStdDev, (hMean + 2 * hStdDev) % 360];
            } else {
              calibratedRanges[color].h = [hMean - 2 * hStdDev, hMean + 2 * hStdDev];
            }
          } else {
            calibratedRanges[color].h = [
              Math.max(0, hMean - 2 * hStdDev),
              Math.min(360, hMean + 2 * hStdDev)
            ];
          }
          
          calibratedRanges[color].s = [
            Math.max(0, sMean - 2 * sStdDev),
            Math.min(100, sMean + 2 * sStdDev)
          ];
          
          calibratedRanges[color].v = [
            Math.max(0, vMean - 2 * vStdDev),
            Math.min(100, vMean + 2 * vStdDev)
          ];
          
          console.log(`Calibrated ${color}: H=${calibratedRanges[color].h[0].toFixed(1)}-${calibratedRanges[color].h[1].toFixed(1)}, S=${calibratedRanges[color].s[0].toFixed(1)}-${calibratedRanges[color].s[1].toFixed(1)}, V=${calibratedRanges[color].v[0].toFixed(1)}-${calibratedRanges[color].v[1].toFixed(1)}`);
        }
      }
    } catch (error) {
      console.error(`Error processing calibration image ${i+1}:`, error.message);
    }
  }
  
  return calibratedRanges;
}

// Function to process multiple cube face images
async function processCubeFaces(imagePaths) {
  if (!imagePaths || imagePaths.length === 0) {
    throw new Error("No image paths provided");
  }
  
  const results = [];
  const colorString = [];
  
  console.log("Processing cube faces...");
  
  // First, calibrate the color ranges using the provided images
  const calibratedRanges = await calibrateColorRanges(imagePaths);
  
  // Process each face
  for (let i = 0; i < imagePaths.length; i++) {
    console.log(`\nProcessing face ${i+1}/${imagePaths.length}: ${imagePaths[i]}`);
    
    try {
      // Check if the file exists
      if (!fs.existsSync(imagePaths[i])) {
        throw new Error(`File does not exist: ${imagePaths[i]}`);
      }
      
      // Read the image file
      const imageBuffer = fs.readFileSync(imagePaths[i]);
      
      // Detect grid centers
      const { gridCenters, colorDistribution } = await detectGridCenters(imageBuffer, i, calibratedRanges);
      
      // Add to results
      results.push(gridCenters);
      
      // Add colors to the string
      const faceColors = gridCenters.map(center => center.color);
      colorString.push(...faceColors);
      
      console.log(`Face ${i+1} colors: ${faceColors.join('')}`);
      
      // Validate the face (should have 9 stickers, ideally with a dominant color)
      if (faceColors.length !== 9) {
        console.warn(`Warning: Face ${i+1} has ${faceColors.length} stickers instead of 9`);
      }
      
      if (colorDistribution.length > 0) {
        const [dominantColor, count] = colorDistribution[0];
        if (count < 5) {
          console.warn(`Warning: Face ${i+1} doesn't have a clear dominant color (${dominantColor}: ${count}/9)`);
        }
      }
    } catch (error) {
      console.error(`Error processing face ${i+1}:`, error.message);
      
      // Add placeholder colors for this face
      const placeholderColor = 'u'; // unknown
      const placeholderFace = Array(9).fill(placeholderColor);
      colorString.push(...placeholderFace);
      
      console.warn(`Using placeholder colors for face ${i+1}: ${placeholderFace.join('')}`);
    }
  }
  
  // Validate the final color string
  const finalColorString = colorString.join('');
  
  console.log("\nValidating color string...");
  
  // Check length
  if (finalColorString.length !== 54) {
    console.warn(`Warning: Color string length is ${finalColorString.length}, expected 54`);
  }
  
  // Count occurrences of each color
  const colorCounts = {};
  for (const color of finalColorString) {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }
  
  console.log("Color distribution:", colorCounts);
  
  // Each color should appear exactly 9 times
  let isValid = true;
  for (const color of ['w', 'r', 'g', 'y', 'o', 'b']) {
    if (colorCounts[color] !== 9) {
      console.warn(`Warning: Color '${color}' appears ${colorCounts[color] || 0} times, expected 9`);
      isValid = false;
    }
  }
  
  if (isValid) {
    console.log("Color string is valid (each color appears exactly 9 times)");
  } else {
    console.warn("Color string is invalid (colors are not distributed correctly)");
    
    // Try to fix the color distribution
    console.log("Attempting to fix color distribution...");
    
    // Identify the dominant color for each face
    const faceDominantColors = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const faceColors = colorString.slice(i * 9, (i + 1) * 9);
      const faceCounts = {};
      
      for (const color of faceColors) {
        faceCounts[color] = (faceCounts[color] || 0) + 1;
      }
      
      // Find the dominant color
      let dominantColor = null;
      let maxCount = 0;
      
      for (const [color, count] of Object.entries(faceCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantColor = color;
        }
      }
      
      faceDominantColors.push(dominantColor);
    }
    
    console.log("Face dominant colors:", faceDominantColors);
    
    // Check if we have all 6 colors
    const uniqueDominantColors = [...new Set(faceDominantColors.filter(c => c !== null))];
    
    if (uniqueDominantColors.length === 6) {
      console.log("All 6 colors are represented in the dominant colors");
      
      // Create a corrected color string
      const correctedColorString = [];
      
      for (let i = 0; i < imagePaths.length; i++) {
        const dominantColor = faceDominantColors[i];
        correctedColorString.push(...Array(9).fill(dominantColor));
      }
      
      console.log("Corrected color string:", correctedColorString.join(''));
      return {
        results,
        colorString: correctedColorString.join(''),
        isValid: false,
        corrected: true
      };
    }
  }
  
  return {
    results,
    colorString: finalColorString,
    isValid,
    corrected: false
  };
}

// Main function
async function main() {
  console.log("Rubik's Cube Face Scanner");
  console.log("=========================");
  
  // Check if image paths are provided as arguments
  const args = process.argv.slice(2);
  let imagePaths = [];
  
  if (args.length >= 6) {
    // Use provided image paths
    imagePaths = args.slice(0, 6);
    console.log("Using provided image paths:", imagePaths);
  } else {
    console.error("Error: Please provide 6 image paths as arguments.");
    console.log("Usage: node cube-scanner.js <image1> <image2> <image3> <image4> <image5> <image6>");
    console.log("Example: node cube-scanner.js white.jpg red.jpg green.jpg yellow.jpg orange.jpg blue.jpg");
    
    // Check if we can find images in the current directory
    try {
      const files = fs.readdirSync(__dirname);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
      
      if (imageFiles.length >= 6) {
        console.log("\nFound image files in the current directory:");
        imageFiles.slice(0, 6).forEach(file => console.log(`- ${file}`));
        
        console.log("\nYou can use these images with:");
        console.log(`node cube-scanner.js ${imageFiles.slice(0, 6).join(' ')}`);
      }
    } catch (err) {
      // Ignore directory reading errors
    }
    
    // Exit with error
    process.exit(1);
  }
  
  try {
    // Process the images
    const { colorString, isValid, corrected } = await processCubeFaces(imagePaths);
    
    console.log("\nFinal color string:");
    console.log(colorString);
    
    if (corrected) {
      console.log("Note: The color string was corrected due to detection issues");
    }
    
    // Save the color string to a file
    try {
      fs.writeFileSync(path.join(OUTPUT_DIR, 'cube_colors.txt'), colorString);
      console.log(`Saved color string to ${path.join(OUTPUT_DIR, 'cube_colors.txt')}`);
    } catch (err) {
      console.error(`Failed to save color string: ${err.message}`);
    }
    
    return colorString;
  } catch (error) {
    console.error("Error processing cube faces:", error.message);
    
    // Generate a fallback color string in case of error
    console.log("\nGenerating fallback color string...");
    const fallbackString = 'wwwwwwwwwrrrrrrrrrgggggggggyyyyyyyyyooooooooobbbbbbbbb';
    console.log("Fallback color string:", fallbackString);
    
    return fallbackString;
  }
}

// Function to enhance image for better color detection
async function enhanceImage(imageBuffer) {
  try {
    // Apply image enhancements to improve color detection
    return await sharp(imageBuffer)
      .normalize() // Normalize the image (improve contrast)
      .modulate({ brightness: 1.1, saturation: 1.2 }) // Slightly increase brightness and saturation
      .sharpen() // Sharpen the image
      .toBuffer();
  } catch (error) {
    console.error("Error enhancing image:", error.message);
    return imageBuffer; // Return original if enhancement fails
  }
}

// Function to detect cube grid using contour detection
async function detectCubeGridWithContours(imageBuffer) {
  // This would implement contour detection to find the cube grid
  // For now, we'll just return a placeholder message
  console.log("Contour detection would identify the cube grid automatically");
  console.log("This would handle cases where the cube is not perfectly aligned");
  
  // In a real implementation, this would:
  // 1. Convert to grayscale
  // 2. Apply Gaussian blur
  // 3. Apply Canny edge detection
  // 4. Find contours
  // 5. Identify the cube grid based on contour properties
  
  return imageBuffer;
}

// Run the main function
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});