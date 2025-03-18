import cv2
import numpy as np
from collections import Counter

def detect_grid(image):
    """
    Detect the Rubik's cube grid and extract the 9 cells
    Returns list of cell images and their coordinates
    """
    # Get image dimensions
    height, width = image.shape[:2]
    
    # Create a simple 3x3 grid based on image dimensions
    # This approach works better for clean, front-facing cube images
    cells = []
    cell_width = width // 3
    cell_height = height // 3
    
    for i in range(3):
        for j in range(3):
            # Calculate cell coordinates
            x1 = j * cell_width
            y1 = i * cell_height
            x2 = (j + 1) * cell_width
            y2 = (i + 1) * cell_height
            
            # Extract cell image
            cell_img = image[y1:y2, x1:x2]
            center_x, center_y = x1 + cell_width//2, y1 + cell_height//2
            cells.append((cell_img, (center_x, center_y)))
    
    return [cell[0] for cell in cells]

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

def visualize_results(image, colors):
    """
    Create a visualization of the detected colors
    """
    # Create a copy of the original image
    result = image.copy()
    
    # Calculate cell size
    h, w = image.shape[:2]
    cell_size_h = h // 3
    cell_size_w = w // 3
    
    # Draw grid
    for i in range(1, 3):
        cv2.line(result, (0, i*cell_size_h), (w, i*cell_size_h), (0, 0, 0), 2)
        cv2.line(result, (i*cell_size_w, 0), (i*cell_size_w, h), (0, 0, 0), 2)
    
    # Draw detected colors
    for i in range(3):
        for j in range(3):
            idx = i * 3 + j
            x, y = j * cell_size_w, i * cell_size_h
            cv2.putText(result, colors[idx], (x + cell_size_w//2 - 10, y + cell_size_h//2 + 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    return result

def main():
    # Load image
    IMAGE_PATH = "image.jpeg"
    OUTPUT_PATH = "detected_colors.jpg"
    
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
    
    # Create facelet string
    facelet_string = ''.join(colors)
    print(f"Detected colors: {colors}")
    print(f"Facelet string for Kociemba's algorithm: {facelet_string}")
    
    # Create visualization
    print(f"Saving visualization to: {OUTPUT_PATH}")
    result = visualize_results(image, colors)
    cv2.imwrite(OUTPUT_PATH, result)
    print(f"Visualization saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()