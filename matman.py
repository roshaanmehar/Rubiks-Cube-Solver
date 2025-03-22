import numpy as np

def strmat(matstring):
    """Converts a string representation of a matrix to a NumPy array."""
    matrix = [list(row.strip()) for row in matstring.strip().split("\n")]
    return np.array(matrix)

def validate_triplet(triplet):
    """Validates a corner triplet according to the rules."""
    # Check if triplet contains only allowed characters
    allowed_chars = ['y', 'w', 'r', 'b', 'g', 'o']
    for char in triplet:
        if char not in allowed_chars:
            return False, f"Character '{char}' is not allowed. Only y, w, r, b, g, o are allowed"
    
    # Check if any letter appears more than once
    char_count = {}
    for char in triplet:
        char_count[char] = char_count.get(char, 0) + 1
        if char_count[char] > 1:
            return False, f"Character '{char}' appears more than once"
    
    # Check for opposite letters
    opposites = {
        'b': 'g', 'g': 'b',
        'y': 'w', 'w': 'y',
        'o': 'r', 'r': 'o'
    }
    
    for i in range(len(triplet)):
        for j in range(i + 1, len(triplet)):
            if opposites.get(triplet[i]) == triplet[j]:
                return False, f"Characters '{triplet[i]}' and '{triplet[j]}' are opposites and cannot be together"
    
    return True, "Valid triplet"

def validate_edge(edge):
    """Validates an edge pair according to the rules."""
    # Check if edge contains only allowed characters
    allowed_chars = ['y', 'w', 'r', 'b', 'g', 'o']
    for char in edge:
        if char not in allowed_chars:
            return False, f"Character '{char}' is not allowed. Only y, w, r, b, g, o are allowed"
    
    # Check if any letter appears more than once
    if edge[0] == edge[1]:
        return False, f"Edge cannot have the same letter twice: '{edge}'"
    
    # Check for opposite letters
    opposites = {
        'b': 'g', 'g': 'b',
        'y': 'w', 'w': 'y',
        'o': 'r', 'r': 'o'
    }
    
    if opposites.get(edge[0]) == edge[1]:
        return False, f"Edge cannot have opposite colors: '{edge}'"
    
    return True, "Valid edge"

def get_corners(faces):
    """Extract all corner triplets from the cube faces."""
    white, red, green, yellow, orange, blue = faces
    
    corners = [
        # White-face corners (clockwise from top-left)
        (white[0, 0], orange[0, 2], blue[0, 0]),    # White-Orange-Blue
        (white[0, 2], blue[0, 2], red[0, 0]),       # White-Blue-Red
        (white[2, 2], red[0, 2], green[0, 0]),      # White-Red-Green
        (white[2, 0], green[0, 2], orange[0, 0]),   # White-Green-Orange
        
        # Yellow-face corners (clockwise from top-left)
        (yellow[0, 0], green[2, 0], red[2, 2]),     # Yellow-Green-Red
        (yellow[0, 2], red[2, 0], blue[2, 2]),      # Yellow-Red-Blue
        (yellow[2, 2], blue[2, 0], orange[2, 2]),   # Yellow-Blue-Orange
        (yellow[2, 0], orange[2, 0], green[2, 2])   # Yellow-Orange-Green
    ]
    
    return corners

def get_edges(faces):
    """Extract all edge pairs from the cube faces."""
    white, red, green, yellow, orange, blue = faces
    
    edges = [
        # White edges
        (white[0, 1], blue[0, 1]),      # White-Blue
        (white[1, 2], red[0, 1]),       # White-Red
        (white[2, 1], green[0, 1]),     # White-Green
        (white[1, 0], orange[0, 1]),    # White-Orange
        
        # Middle layer edges
        (blue[1, 0], orange[1, 2]),     # Blue-Orange
        (blue[1, 2], red[1, 0]),        # Blue-Red
        (red[1, 2], green[1, 0]),       # Red-Green
        (green[1, 2], orange[1, 0]),    # Green-Orange
        
        # Yellow edges
        (yellow[0, 1], red[2, 1]),      # Yellow-Red
        (yellow[1, 2], blue[2, 1]),     # Yellow-Blue
        (yellow[2, 1], orange[2, 1]),   # Yellow-Orange
        (yellow[1, 0], green[2, 1])     # Yellow-Green
    ]
    
    return edges

def rotate_face_clockwise(face):
    """Rotate a face clockwise."""
    return np.rot90(face, k=3)  # k=3 is equivalent to rotating once clockwise

def rotate_face_counter_clockwise(face):
    """Rotate a face counter-clockwise."""
    return np.rot90(face, k=1)

def validate_cube(white, red, green, yellow, orange, blue):
    """Validate the entire cube configuration."""
    faces = [white, red, green, yellow, orange, blue]
    
    # Check corners
    corners = get_corners(faces)
    for i, corner in enumerate(corners):
        valid, reason = validate_triplet(corner)
        if not valid:
            print(f"Corner {i+1} is invalid: {reason}")
            print(f"Corner colors: {corner}")
            return False
    
    # Check edges
    edges = get_edges(faces)
    for i, edge in enumerate(edges):
        valid, reason = validate_edge(edge)
        if not valid:
            print(f"Edge {i+1} is invalid: {reason}")
            print(f"Edge colors: {edge}")
            return False
    
    return True

def cube_to_string(white, red, green, yellow, orange, blue):
    """Convert the cube to a single string in URFDLB (wrgyob) order."""
    result = ""
    # Up (white)
    for row in white:
        for cell in row:
            result += cell
    # Right (red)
    for row in red:
        for cell in row:
            result += cell
    # Front (green)
    for row in green:
        for cell in row:
            result += cell
    # Down (yellow)
    for row in yellow:
        for cell in row:
            result += cell
    # Left (orange)
    for row in orange:
        for cell in row:
            result += cell
    # Back (blue)
    for row in blue:
        for cell in row:
            result += cell
    
    return result

# Parse the input matrices
white_mat = strmat("""boo
ywr
ggb""")

red_mat = strmat("""www
wrr
yyw""")

green_mat = strmat("""oyy
ogw
rry""")

yellow_mat = strmat("""oyo
oyo
rbg""")

orange_mat = strmat("""wwy
bob
grr""")

blue_mat = strmat("""rbb
gbg
ggb""")

# Validate the cube
print("Validating cube configuration...")
if validate_cube(white_mat, red_mat, green_mat, yellow_mat, orange_mat, blue_mat):
    print("Cube configuration is valid!")
    cube_string = cube_to_string(white_mat, red_mat, green_mat, yellow_mat, orange_mat, blue_mat)
    print(f"Cube string: {cube_string}")
else:
    print("Cube configuration is invalid.")
    print("Attempting to fix the configuration...")
    # Here you would implement the rotation logic to fix the cube
    # This is a complex algorithm that would require tracking which corners/edges are invalid
    # and determining which faces to rotate to resolve conflicts