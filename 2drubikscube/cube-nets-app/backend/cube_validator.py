import itertools

# Define opposite colors & valid colors
opposites = {
    'w': 'y', 'y': 'w',
    'r': 'o', 'o': 'r',
    'g': 'b', 'b': 'g'
}
valid_colors = set(opposites.keys())  # {'w','y','r','o','g','b'}

# Define the mapping from colors to Kociemba face characters
COLOR_TO_FACE_CHAR = {
    'w': 'U',  # White -> Up
    'r': 'R',  # Red -> Right
    'g': 'F',  # Green -> Front
    'y': 'D',  # Yellow -> Down
    'o': 'L',  # Orange -> Left
    'b': 'B',  # Blue -> Back
}

# Expected centers in standard orientation
EXPECTED_CENTERS = {'U': 'w', 'R': 'r', 'F': 'g', 'D': 'y', 'L': 'o', 'B': 'b'}
FACE_ORDER_KOCIEMBA = ['U', 'R', 'F', 'D', 'L', 'B']  # Standard URFDLB order

def check_color_counts(faces):
    """
    Checks if each color appears exactly 9 times.
    """
    all_stickers = list(itertools.chain.from_iterable(faces))
    
    if len(all_stickers) != 54:
        return False, f"Invalid number of stickers: {len(all_stickers)} (expected 54)"
    
    invalid_colors = [c for c in all_stickers if c not in valid_colors]
    if invalid_colors:
        return False, f"Invalid colors found: {set(invalid_colors)}"
    
    for c in valid_colors:
        count = all_stickers.count(c)
        if count != 9:
            return False, f"Color '{c}' appears {count} times (expected 9)"
    
    return True, ""

def rotate_face_90(face_list):
    """
    Rotates a 9-element face list 90 degrees clockwise.
    """
    return [
        face_list[6], face_list[3], face_list[0],
        face_list[7], face_list[4], face_list[1],
        face_list[8], face_list[5], face_list[2]
    ]

def rotate_face(face_list, times):
    """
    Rotates a face list `times` * 90 degrees clockwise.
    """
    result = face_list[:]
    for _ in range(times % 4):  # Ensure times is 0, 1, 2, or 3
        result = rotate_face_90(result)
    return result

def check_piece_validity(piece_str):
    """
    Checks if an edge (2 chars) or corner (3 chars) string is valid.
    """
    if len(set(piece_str)) != len(piece_str):
        return False, f"repeated color in piece '{piece_str}'"
    
    for c1 in piece_str:
        for c2 in piece_str:
            if c1 != c2 and opposites.get(c1) == c2:
                return False, f"opposite colors '{c1}'/'{c2}' in piece '{piece_str}'"
    
    return True, ""

def is_valid_arrangement(u, r, f, d, l, b):
    """
    Checks centers, edges, and corners for a given orientation of face lists.
    Assumes standard color scheme for centers (U=w, R=r, etc.).
    Returns (True, "") if valid, or (False, reason) if invalid.
    """
    faces = {'U': u, 'R': r, 'F': f, 'D': d, 'L': l, 'B': b}
    
    # 1. Check Center Pieces
    for face_char, expected_color in EXPECTED_CENTERS.items():
        if faces[face_char][4] != expected_color:
            return False, f"Center piece mismatch: {face_char} center is '{faces[face_char][4]}', expected '{expected_color}'"
    
    # 2. Define and Check Corners (using standard URFDLB notation indices)
    corners = [
        (u[0] + l[0] + b[2], "ULB"),
        (u[2] + b[0] + r[2], "UBR"),
        (u[6] + f[0] + l[2], "UFL"),
        (u[8] + r[0] + f[2], "URF"),
        (d[0] + l[8] + f[6], "DLF"),
        (d[2] + f[8] + r[6], "DFR"),
        (d[6] + b[8] + l[6], "DBL"),
        (d[8] + r[8] + b[6], "DRB"),
    ]
    
    for piece_str, label in corners:
        ok, reason = check_piece_validity(piece_str)
        if not ok:
            return False, f"Invalid {label} corner: {reason}"
    
    # 3. Define and Check Edges
    edges = [
        (u[1] + b[1], "UB"),
        (u[3] + l[1], "UL"),
        (u[5] + r[1], "UR"),
        (u[7] + f[1], "UF"),
        (d[1] + f[7], "DF"),
        (d[3] + l[7], "DL"),
        (d[5] + r[7], "DR"),
        (d[7] + b[7], "DB"),
        (f[3] + l[5], "FL"),
        (f[5] + r[3], "FR"),
        (b[3] + r[5], "BR"),
        (b[5] + l[3], "BL"),
    ]
    
    for piece_str, label in edges:
        ok, reason = check_piece_validity(piece_str)
        if not ok:
            return False, f"Invalid {label} edge: {reason}"
    
    return True, ""  # All checks passed

def validate_and_orient(u_str, r_str, f_str, d_str, l_str, b_str):
    """
    Takes 6 face strings (lowercase colors), checks counts, finds valid orientation.
    Returns (kociemba_string, None) on success, or (None, error_message) on failure.
    """
    # Convert input strings to lists
    try:
        faces_input = {
            'U': list(u_str), 'R': list(r_str), 'F': list(f_str),
            'D': list(d_str), 'L': list(l_str), 'B': list(b_str)
        }
        if any(len(face) != 9 for face in faces_input.values()):
            raise ValueError("All faces must have 9 stickers.")
    except Exception as e:
        return None, f"Input error: {e}"
    
    # 1. Check Color Counts
    ok, reason = check_color_counts(faces_input.values())
    if not ok:
        return None, reason
    
    # 2. Brute force check all 4^6 = 4096 orientations
    all_rotations = [0, 1, 2, 3]
    for u_rot, r_rot, f_rot, d_rot, l_rot, b_rot in itertools.product(all_rotations, repeat=6):
        # Rotate faces according to current combination
        u_rotated = rotate_face(faces_input['U'], u_rot)
        r_rotated = rotate_face(faces_input['R'], r_rot)
        f_rotated = rotate_face(faces_input['F'], f_rot)
        d_rotated = rotate_face(faces_input['D'], d_rot)
        l_rotated = rotate_face(faces_input['L'], l_rot)
        b_rotated = rotate_face(faces_input['B'], b_rot)
        
        # Check if this arrangement is valid
        valid, reason = is_valid_arrangement(
            u_rotated, r_rotated, f_rotated, d_rotated, l_rotated, b_rotated
        )
        
        if valid:
            # Found a valid orientation! Construct the Kociemba string (URFDLB order).
            # Convert lowercase colors to uppercase face chars needed by kociemba.
            try:
                kociemba_str = "".join(
                    COLOR_TO_FACE_CHAR[c] for c in itertools.chain(
                        u_rotated, r_rotated, f_rotated, d_rotated, l_rotated, b_rotated
                    )
                )
                # Final sanity check on length
                if len(kociemba_str) != 54:
                    raise ValueError("Internal error: Generated Kociemba string is not 54 chars.")
                return kociemba_str, None  # Success
            except KeyError as e:
                # This shouldn't happen if color counts/validity were checked
                return None, f"Internal error: Invalid color character '{e}' during Kociemba string conversion."
            except Exception as e:
                return None, f"Internal error: {e}"
    
    # If loop finishes, no valid orientation was found
    return None, "Invalid State: Colors are correct, but no valid orientation found (check edges/corners)."