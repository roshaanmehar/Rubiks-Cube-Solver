import cv2
import numpy as np
import matplotlib.pyplot as plt
import os

def extract_center_square(image):
    """Extract the center square from a 3x3 grid"""
    h, w = image.shape[:2]
    cell_h, cell_w = h // 3, w // 3
    
    # Extract center square
    center_y, center_x = h // 2, w // 2
    center_square = image[center_y - cell_h//2:center_y + cell_h//2, 
                         center_x - cell_w//2:center_x + cell_w//2]
    return center_square

def detect_dots(square_img):
    """Detect dots in the center square"""
    # Convert to grayscale
    gray = cv2.cvtColor(square_img, cv2.COLOR_BGR2GRAY)
    
    # Apply threshold to isolate dots (assuming dots are darker than background)
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter contours by size to find dots
    dots = []
    min_area = 10  # Minimum area to be considered a dot
    max_area = 500  # Maximum area to be considered a dot
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if min_area < area < max_area:
            M = cv2.moments(contour)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                dots.append((cx, cy))
    
    return dots, thresh

def check_orientation(dots, img_shape):
    """
    Check if the image is correctly oriented
    The corner with no dot should be at the bottom right
    """
    h, w = img_shape[:2]
    
    # Divide the image into quadrants
    quadrants = {
        "top_left": [],
        "top_right": [],
        "bottom_left": [],
        "bottom_right": []
    }
    
    # Assign dots to quadrants
    for x, y in dots:
        if x < w/2 and y < h/2:
            quadrants["top_left"].append((x, y))
        elif x >= w/2 and y < h/2:
            quadrants["top_right"].append((x, y))
        elif x < w/2 and y >= h/2:
            quadrants["bottom_left"].append((x, y))
        else:
            quadrants["bottom_right"].append((x, y))
    
    # Check if bottom right quadrant has no dots
    if len(quadrants["bottom_right"]) == 0:
        return True, quadrants
    else:
        return False, quadrants

def rotate_image(image, angle):
    """Rotate the image by the given angle"""
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, rotation_matrix, (w, h))
    return rotated

def find_correct_orientation(image):
    """Find the correct orientation by trying all 4 possible rotations"""
    best_rotation = None
    best_angle = 0
    best_quadrant_score = -1
    
    # Try all 4 possible rotations
    for angle in [0, 90, 180, 270]:
        rotated = rotate_image(image, angle)
        center_square = extract_center_square(rotated)
        dots, _ = detect_dots(center_square)
        
        # Skip if we don't have enough dots
        if len(dots) < 3:
            continue
            
        is_correct, quadrants = check_orientation(dots, center_square.shape)
        
        # Calculate a score based on dot distribution
        # Ideally: 1+ dots in top-left, 1+ dots in top-right, 1+ dots in bottom-left, 0 dots in bottom-right
        quadrant_score = 0
        if len(quadrants["top_left"]) > 0: quadrant_score += 1
        if len(quadrants["top_right"]) > 0: quadrant_score += 1
        if len(quadrants["bottom_left"]) > 0: quadrant_score += 1
        if len(quadrants["bottom_right"]) == 0: quadrant_score += 3  # Higher weight for empty bottom-right
        
        print(f"Angle {angle}°: {len(dots)} dots, correct: {is_correct}, score: {quadrant_score}")
        print(f"  Quadrants: TL:{len(quadrants['top_left'])}, TR:{len(quadrants['top_right'])}, BL:{len(quadrants['bottom_left'])}, BR:{len(quadrants['bottom_right'])}")
        
        # If this rotation is better than what we've seen so far, remember it
        if quadrant_score > best_quadrant_score:
            best_quadrant_score = quadrant_score
            best_rotation = rotated
            best_angle = angle
    
    # If we couldn't find a good orientation, return the original
    if best_rotation is None:
        return image, 0
    
    return best_rotation, best_angle

def detect_grid(image):
    """
    Detect the Rubik's cube grid and extract the 9 cells
    Returns list of cell images
    """
    # Get image dimensions
    height, width = image.shape[:2]
    
    # Create a simple 3x3 grid based on image dimensions
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
            cells.append(cell_img)
    
    return cells

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
    # Ask user for image path
    image_path = input("Enter the path to your Rubik's cube image (or press Enter to use 'image.jpeg'): ")
    
    # Use default if no input
    if not image_path:
        image_path = "image.jpeg"
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' does not exist.")
        return
    
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not read image from '{image_path}'. Make sure it's a valid image file.")
        return
    
    print(f"Successfully loaded image: {image_path}")
    
    # Extract center square
    center_square = extract_center_square(image)
    
    # Detect dots in the center square
    dots, thresh = detect_dots(center_square)
    print(f"Detected {len(dots)} dots in the center square")
    
    # Check if the orientation is correct
    is_correct, quadrants = check_orientation(dots, center_square.shape)
    print(f"Is orientation correct? {is_correct}")
    
    # Print quadrant information
    for quadrant, points in quadrants.items():
        print(f"{quadrant}: {len(points)} dots")
    
    # Find the correct orientation
    print("Finding correct orientation...")
    corrected_image, angle = find_correct_orientation(image)
    
    if angle != 0:
        print(f"Image needed to be rotated by {angle} degrees")
        center_square = extract_center_square(corrected_image)
        dots, thresh = detect_dots(center_square)
        is_correct, quadrants = check_orientation(dots, center_square.shape)
        
        print(f"After rotation: Detected {len(dots)} dots, orientation correct? {is_correct}")
        
        # Print updated quadrant information
        for quadrant, points in quadrants.items():
            print(f"{quadrant} (after rotation): {len(points)} dots")
        
        # Save the corrected image
        output_path = "corrected_" + os.path.basename(image_path)
        cv2.imwrite(output_path, corrected_image)
        print(f"Corrected image saved as '{output_path}'")
        
        # Use the corrected image for further processing
        image = corrected_image
    else:
        print("Image is already in the correct orientation")
    
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
    print("Creating visualization...")
    result = visualize_results(image, colors)
    vis_output_path = "detected_colors_" + os.path.basename(image_path)
    cv2.imwrite(vis_output_path, result)
    print(f"Visualization saved to {vis_output_path}")
    
    # Display visualizations (non-blocking)
    plt.ion()  # Turn on interactive mode so plt.show() doesn't block
    
    # Visualize the center square with dots
    center_vis = center_square.copy()
    for x, y in dots:
        cv2.circle(center_vis, (x, y), 5, (0, 0, 255), -1)
    
    plt.figure(figsize=(10, 5))
    plt.subplot(121)
    plt.title(f"Center Square with {len(dots)} Dots")
    plt.imshow(cv2.cvtColor(center_vis, cv2.COLOR_BGR2RGB))
    plt.subplot(122)
    plt.title("Thresholded Image for Dot Detection")
    plt.imshow(thresh, cmap='gray')
    
    # Display the color detection results
    plt.figure(figsize=(10, 5))
    plt.title("Detected Colors")
    plt.imshow(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))
    
    plt.draw()
    plt.pause(0.001)  # Small pause to update the figures
    
    print("\nScript completed successfully!")
    
    # Keep the script running until user presses Enter
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()