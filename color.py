import cv2
import numpy as np
import matplotlib.pyplot as plt

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
    for angle in [0, 90, 180, 270]:
        rotated = rotate_image(image, angle)
        center_square = extract_center_square(rotated)
        dots, _ = detect_dots(center_square)
        is_correct, _ = check_orientation(dots, center_square.shape)
        
        if is_correct and len(dots) == 3:  # We found the correct orientation with 3 dots
            return rotated, angle
    
    # If we couldn't find a correct orientation, return the original
    return image, 0

# Load the image
image = cv2.imread('WhatsApp Image 2025-03-18 at 6.14.05 PM.jpeg')
if image is None:
    # Try using the URL if local file doesn't work
    url = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-18%20at%206.14.05%20PM-REnyFk7ZfOqVB1QzwDGA7yeQORysYT.jpeg'
    import urllib.request
    resp = urllib.request.urlopen(url)
    image = np.asarray(bytearray(resp.read()), dtype="uint8")
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

# Extract center square
center_square = extract_center_square(image)

# Detect dots in the center square
dots, thresh = detect_dots(center_square)
print(f"Detected {len(dots)} dots in the center square")

# Check if the orientation is correct
is_correct, quadrants = check_orientation(dots, center_square.shape)
print(f"Is orientation correct? {is_correct}")

# If orientation is not correct, find the correct orientation
if not is_correct or len(dots) != 3:
    corrected_image, angle = find_correct_orientation(image)
    print(f"Image needed to be rotated by {angle} degrees")
    center_square = extract_center_square(corrected_image)
    dots, thresh = detect_dots(center_square)
    is_correct, quadrants = check_orientation(dots, center_square.shape)
    print(f"After rotation: Detected {len(dots)} dots, orientation correct? {is_correct}")
    
    # Display the corrected image
    plt.figure(figsize=(10, 10))
    plt.subplot(121)
    plt.title("Original Image")
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.subplot(122)
    plt.title(f"Corrected Image (rotated {angle}°)")
    plt.imshow(cv2.cvtColor(corrected_image, cv2.COLOR_BGR2RGB))
else:
    print("Image is already in the correct orientation")
    # Display the original image
    plt.figure(figsize=(10, 5))
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.title("Image (already in correct orientation)")

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

plt.tight_layout()
plt.show()

# Print quadrant information
for quadrant, points in quadrants.items():
    print(f"{quadrant}: {len(points)} dots")