import cv2
import numpy as np
from PIL import Image
import io

# --- Image Processing & Color Detection ---

# Define HSV color ranges (These NEED careful tuning for your lighting!)
# Ranges: [(Lower Hue, Lower Sat, Lower Val), (Upper Hue, Upper Sat, Upper Val)]
# Hue range is 0-179 in OpenCV
COLOR_RANGES_HSV = {
    # White (low saturation, high value) - Adjust Sat/Val thresholds carefully
    'w': [(0, 0, 180), (179, 55, 255)],
    # Yellow (yellow hue range)
    'y': [(20, 80, 80), (35, 255, 255)],
    # Blue (blue hue range)
    'b': [(95, 80, 50), (130, 255, 255)],
     # Green (green hue range)
    'g': [(40, 60, 40), (85, 255, 255)],
     # Red (wraps around 0/180 hue - requires two ranges)
    'r1': [(0, 80, 50), (10, 255, 255)],   # Low hue red part
    'r2': [(165, 80, 50), (179, 255, 255)], # High hue red part
    # Orange (orange hue range - check overlap with red/yellow!)
    'o': [(5, 100, 100), (20, 255, 255)], # Check if too close to r1 or y
}

def classify_color_hsv(h, s, v):
    """Classifies an HSV color into w,y,b,g,r,o or '?'."""
    # Prioritize White/Gray based on Saturation/Value first
    if s < 50 and v > 175: return 'w'
    # Prioritize Black/Dark based on Value
    if v < 40: return '?' # Too dark to classify reliably

    # Check Red ranges (special case)
    if ((h >= COLOR_RANGES_HSV['r1'][0][0] and h <= COLOR_RANGES_HSV['r1'][1][0]) or \
        (h >= COLOR_RANGES_HSV['r2'][0][0] and h <= COLOR_RANGES_HSV['r2'][1][0])) and \
       (s >= COLOR_RANGES_HSV['r1'][0][1] and s <= COLOR_RANGES_HSV['r1'][1][1]) and \
       (v >= COLOR_RANGES_HSV['r1'][0][2] and v <= COLOR_RANGES_HSV['r1'][1][2]):
        return 'r'

    # Check other standard ranges
    for color, ranges in COLOR_RANGES_HSV.items():
        if color in ['r1', 'r2', 'w']: continue # Skip red parts and white (already checked)

        lower, upper = ranges
        if h >= lower[0] and h <= upper[0] and \
           s >= lower[1] and s <= upper[1] and \
           v >= lower[2] and v <= upper[2]:
            return color

    # If no range matched
    print(f"Debug: No range match for HSV=({h},{s},{v})") # Log unmatched values
    return '?' # Unknown

def process_single_image(image_bytes):
    """
    Processes one image: finds face, detects 9 stickers & center color.
    Returns (face_color_string, center_color) or (None, error_message)
    """
    try:
        # Load image using Pillow and convert to OpenCV format (BGR)
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        open_cv_image = np.array(img)
        open_cv_image = open_cv_image[:, :, ::-1].copy() # Convert RGB to BGR

        # --- 1. Find Cube Face ---
        # === PLACEHOLDER: Simple Center Crop ===
        # A robust solution would use OpenCV contour detection and potentially
        # perspective transformation here (cv2.findContours, cv2.approxPolyDP,
        # cv2.getPerspectiveTransform, cv2.warpPerspective).
        # This placeholder assumes the cube face is roughly centered.
        height, width, _ = open_cv_image.shape
        size = min(height, width)
        # Crop slightly less aggressively to potentially catch misaligned cubes
        crop_size = int(size * 0.9)
        start_x = max(0, (width - crop_size) // 2)
        start_y = max(0, (height - crop_size) // 2)
        end_x = start_x + crop_size
        end_y = start_y + crop_size
        cropped_face = open_cv_image[start_y:end_y, start_x:end_x]

        if cropped_face.size == 0:
            return None, "Failed to crop image (result was empty)."

        # Resize to a standard size for consistent grid sampling (e.g., 150x150)
        # Using INTER_AREA is generally good for shrinking
        processed_face = cv2.resize(cropped_face, (150, 150), interpolation=cv2.INTER_AREA)

        # --- 2. Detect Stickers ---
        stickers = []
        cell_size = processed_face.shape[0] // 3 # 150 / 3 = 50
        # Sample a smaller central region within each cell to avoid edges/glare
        sample_offset = cell_size // 4 # e.g., 12 pixels from cell border
        sample_size = cell_size - 2 * sample_offset # e.g., 50 - 2*12 = 26

        if sample_size <= 0: sample_size = 1 # Ensure sample size is at least 1

        for r in range(3):
            for c in range(3):
                # Define the sampling Region of Interest (ROI)
                y1 = r * cell_size + sample_offset
                y2 = y1 + sample_size
                x1 = c * cell_size + sample_offset
                x2 = x1 + sample_size

                roi = processed_face[y1:y2, x1:x2]

                if roi.size == 0:
                     print(f"Warning: ROI empty for cell ({r},{c})")
                     stickers.append('?')
                     continue

                # Calculate average BGR color, then convert to HSV
                avg_bgr = np.mean(roi, axis=(0, 1))
                avg_hsv = cv2.cvtColor(np.uint8([[avg_bgr]]), cv2.COLOR_BGR2HSV)[0][0]
                h, s, v = avg_hsv[0], avg_hsv[1], avg_hsv[2]

                # Classify the color
                color_char = classify_color_hsv(h, s, v)
                stickers.append(color_char)

        if len(stickers) != 9:
             return None, f"Internal error: Detected {len(stickers)} stickers instead of 9."

        face_string = "".join(stickers)
        center_color = stickers[4] # Center sticker color determines the face

        if center_color == '?':
            return None, "Failed to reliably detect the center sticker color."

        return face_string, center_color

    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Error processing image: {e}\n{traceback.format_exc()}")
        return None, f"Unexpected error during image processing."