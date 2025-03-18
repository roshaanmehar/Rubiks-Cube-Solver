import cv2
import numpy as np
from collections import Counter

# Hardcoded image path
IMAGE_PATH = "rubiks_cube_face.jpg"
# Optional: Path to save visualization output
OUTPUT_PATH = "detected_colors.jpg"

def detect_grid(image):
    """
    Detect the Rubik's cube grid and extract the 9 cells
    Returns list of cell images and their coordinates
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Adaptive thresholding to get binary image
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Find contours
    contours, _ = cv2.findContours(
        thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Filter contours by area and shape (approximately square)
    min_area = image.shape[0] * image.shape[1] / 81  # Minimum expected cell area
    cells = []
    
    for contour in contours:
        area = cv2.contourArea(contour)
        
        # Skip small contours
        if area < min_area:
            continue
            
        # Approximate the contour shape
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
        
        # Check if it's approximately a square (4 vertices)
        if len(approx) == 4:
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Check if it's approximately square
            aspect_ratio = float(w) / h
            if 0.8 <= aspect_ratio <= 1.2:
                # Extract cell image
                cell_img = image[y:y+h, x:x+w]
                # Store cell image and its center coordinates
                center_x, center_y = x + w//2, y + h//2
                cells.append((cell_img, (center_x, center_y)))
    
    # Check if we found exactly 9 cells
    if len(cells) != 9:
        print(f"Warning: Found {len(cells)} cells instead of 9. Image may not be a valid Rubik's cube face.")
        # If too many cells were found, try to find the most likely 9
        if len(cells) > 9:
            # Sort by area (largest first)
            cells.sort(key=lambda x: x[0].shape[0] * x[0].shape[1], reverse=True)
            cells = cells[:9]
    
    # Sort cells by position (top to bottom, left to right)
    cells.sort(key=lambda x: (x[1][1], x[1][0]))
    
    # Arrange into 3x3 grid
    grid = []
    for i in range(0, 9, 3):
        row = cells[i:i+3]
        # Sort row by x-coordinate
        row.sort(key=lambda x: x[1][0])
        grid.extend(row)
        
    return [cell[0] for cell in grid]

def identify_colors(cells):
    """
    Identify the color of each cell
    Returns a list of color labels
    """
    # Color reference values (BGR format)
    color_references = {
        'W': (200, 200, 200),  # White
        'Y': (0, 230, 230),    # Yellow
        'G': (0, 180, 0),      # Green
        'B': (200, 0, 0),      # Blue (appears red in BGR)
        'R': (0, 0, 200),      # Red (appears blue in BGR)
        'O': (0, 140, 240)     # Orange
    }
    
    results = []
    
    for cell in cells:
        # Resize for consistent processing
        cell = cv2.resize(cell, (50, 50))
        
        # Get the central region of the cell to avoid edges
        center_region = cell[15:35, 15:35]
        
        # Calculate the average color
        avg_color = np.mean(center_region, axis=(0, 1))
        
        # Find the closest reference color
        min_dist = float('inf')
        color_label = None
        
        for label, ref_color in color_references.items():
            # Calculate Euclidean distance in color space
            dist = np.sqrt(sum((avg_color - ref_color)**2))
            if dist < min_dist:
                min_dist = dist
                color_label = label
        
        results.append(color_label)
    
    return results

def validate_face(colors):
    """
    Validate the detected face by checking common rules
    """
    # Check if we have exactly 9 colors
    if len(colors) != 9:
        return False, f"Expected 9 colors, got {len(colors)}"
    
    # Check if the center color appears somewhere else
    center_color = colors[4]
    if colors.count(center_color) != 1:
        return False, f"Center color {center_color} should be unique on a face"
    
    # Check if all colors appear a reasonable number of times
    color_counts = Counter(colors)
    for color, count in color_counts.items():
        if count > 5:  # No color should appear more than 5 times on a face
            return False, f"Color {color} appears {count} times, which is too many"
    
    return True, "Valid face"

def visualize_results(image, cells, colors):
    """
    Create a visualization of the detected colors
    """
    # Create a copy of the original image
    result = image.copy()
    
    # Calculate cell size
    h, w = image.shape[:2]
    cell_size = min(h, w) // 3
    
    # Draw grid
    for i in range(1, 3):
        cv2.line(result, (0, i*cell_size), (w, i*cell_size), (0, 0, 0), 2)
        cv2.line(result, (i*cell_size, 0), (i*cell_size, h), (0, 0, 0), 2)
    
    # Draw detected colors
    for i in range(3):
        for j in range(3):
            idx = i * 3 + j
            x, y = j * cell_size, i * cell_size
            cv2.putText(result, colors[idx], (x + cell_size//2 - 10, y + cell_size//2 + 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    return result

def main():
    # Load image from hardcoded path
    print(f"Loading image from: {IMAGE_PATH}")
    image = cv2.imread(IMAGE_PATH)
    if image is None:
        print(f"Error: Could not read image from {IMAGE_PATH}")
        return
    
    # Detect grid and extract cells
    print("Detecting cube grid...")
    cells = detect_grid(image)
    
    # Check if we found 9 cells
    if len(cells) != 9:
        print(f"Error: Found {len(cells)} cells instead of 9. Please provide a clearer image.")
        return
    
    # Identify colors
    print("Identifying colors...")
    colors = identify_colors(cells)
    
    # Validate face
    valid, message = validate_face(colors)
    if not valid:
        print(f"Error: Invalid Rubik's cube face - {message}")
        return
    
    # Create facelet string
    facelet_string = ''.join(colors)
    print(f"Detected colors: {colors}")
    print(f"Facelet string for Kociemba's algorithm: {facelet_string}")
    
    # Create visualization
    print(f"Saving visualization to: {OUTPUT_PATH}")
    result = visualize_results(image, cells, colors)
    cv2.imwrite(OUTPUT_PATH, result)
    print(f"Visualization saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()