import itertools

# --- Configuration ---
COLOR_TO_FACE_CHAR = {'w': 'U', 'r': 'R', 'g': 'F', 'y': 'D', 'o': 'L', 'b': 'B'}
VALID_COLORS = set(COLOR_TO_FACE_CHAR.keys())
EXPECTED_CENTERS = {'U': 'w', 'R': 'r', 'F': 'g', 'D': 'y', 'L': 'o', 'B': 'b'}
FACE_ORDER_KOCIEMBA = ['U', 'R', 'F', 'D', 'L', 'B'] # Standard URFDLB order
opposites = {'w': 'y', 'y': 'w', 'r': 'o', 'o': 'r', 'g': 'b', 'b': 'g'}

# --- Validation & Orientation Logic ---

def check_color_counts(face_lists):
    """Checks if each color appears exactly 9 times."""
    all_stickers = list(itertools.chain.from_iterable(face_lists))

    if len(all_stickers) != 54:
        return False, f"Invalid number of stickers: {len(all_stickers)} (expected 54)"

    invalid_colors = [c for c in all_stickers if c not in VALID_COLORS]
    if invalid_colors:
        # Filter out potential placeholder '?' before reporting
        actual_invalid = set(c for c in invalid_colors if c != '?')
        if actual_invalid:
             return False, f"Invalid colors found: {actual_invalid}"
        # If only '?' were found, it's a detection issue, not necessarily invalid input type
        if '?' in invalid_colors:
            return False, "Color detection failed for one or more stickers ('?' found)."


    for c in VALID_COLORS:
        count = all_stickers.count(c)
        if count != 9:
            return False, f"Color '{c}' appears {count} times (expected 9)"
    return True, ""

def rotate_face_90(face_list):
    """Rotates a 9-element face list 90 degrees clockwise."""
    if len(face_list) != 9: return face_list # Safety check
    return [
        face_list[6], face_list[3], face_list[0],
        face_list[7], face_list[4], face_list[1],
        face_list[8], face_list[5], face_list[2]
    ]

def rotate_face(face_list, times):
    """Rotates a face list `times` * 90 degrees clockwise."""
    result = face_list[:]
    for _ in range(times % 4): # Ensure times is 0, 1, 2, or 3
        result = rotate_face_90(result)
    return result

def check_piece_validity(piece_str):
    """Checks if an edge (2 chars) or corner (3 chars) string is valid."""
    # Ignore pieces with placeholder '?'
    if '?' in piece_str:
        return True, "" # Assume valid for now, let count check handle '?' overall

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
    Expects input lists (u, r, f, d, l, b) with lowercase color chars or '?'.
    """
    faces = {'U': u, 'R': r, 'F': f, 'D': d, 'L': l, 'B': b}

    # 1. Check Center Pieces (allow '?' during rotation check)
    for face_char, expected_color in EXPECTED_CENTERS.items():
        center_val = faces[face_char][4]
        if center_val != '?' and center_val != expected_color:
            return False, f"Center piece mismatch: {face_char} center is '{center_val}', expected '{expected_color}'"

    # 2. Define and Check Corners (using standard URFDLB notation indices)
    corners = [
        (u[8] + r[0] + f[2], "URF"), (u[6] + f[0] + l[2], "UFL"),
        (u[0] + l[0] + b[2], "ULB"), (u[2] + b[0] + r[2], "UBR"),
        (d[2] + f[8] + r[6], "DFR"), (d[0] + l[8] + f[6], "DLF"),
        (d[6] + b[8] + l[6], "DBL"), (d[8] + r[8] + b[6], "DRB"),
    ]
    for piece_str, label in corners:
        ok, reason = check_piece_validity(piece_str)
        if not ok: return False, f"Invalid {label} corner: {reason}"

    # 3. Define and Check Edges
    edges = [
        (u[7] + f[1], "UF"), (u[5] + r[1], "UR"), (u[1] + b[1], "UB"), (u[3] + l[1], "UL"),
        (d[1] + f[7], "DF"), (d[5] + r[7], "DR"), (d[7] + b[7], "DB"), (d[3] + l[7], "DL"), # Corrected L index for DL
        (f[5] + r[3], "FR"), (f[3] + l[5], "FL"), (b[5] + l[3], "BL"), (b[3] + r[5], "BR"),
    ]
    for piece_str, label in edges:
        ok, reason = check_piece_validity(piece_str)
        if not ok: return False, f"Invalid {label} edge: {reason}"

    # If we got here, the arrangement seems valid structurally
    # Final check: ensure no placeholders '?' remain in a valid state
    all_stickers = list(itertools.chain(u, r, f, d, l, b))
    if '?' in all_stickers:
         return False, "Internal check failed: Placeholder '?' found in structurally valid state."

    return True, "" # All checks passed


def validate_and_orient(u_str, r_str, f_str, d_str, l_str, b_str):
    """
    Takes 6 face strings (lowercase colors or '?'), checks counts, finds valid orientation.
    Returns (urfldb_kociemba_string (UPPERCASE), None) on success,
    or (None, error_message) on failure.
    Input strings correspond to faces with centers w,r,g,y,o,b respectively.
    """
    # Convert input strings to lists
    try:
        faces_input_map = {
            'w': list(u_str), 'r': list(r_str), 'g': list(f_str),
            'y': list(d_str), 'o': list(l_str), 'b': list(b_str)
        }
        if any(len(face) != 9 for face in faces_input_map.values()):
            raise ValueError("All faces must have 9 stickers.")
    except Exception as e:
        return None, f"Input error: {e}"

    # Get faces in URFDLB order based on expected centers
    try:
         u_list = faces_input_map[EXPECTED_CENTERS['U']]
         r_list = faces_input_map[EXPECTED_CENTERS['R']]
         f_list = faces_input_map[EXPECTED_CENTERS['F']]
         d_list = faces_input_map[EXPECTED_CENTERS['D']]
         l_list = faces_input_map[EXPECTED_CENTERS['L']]
         b_list = faces_input_map[EXPECTED_CENTERS['B']]
    except KeyError as e:
         # This happens if image processing failed to identify a center color correctly
         return None, f"Internal Error: Could not find input face corresponding to expected center '{EXPECTED_CENTERS.get(str(e), '?')}'. Check image processing results."

    # 1. Check Color Counts (allow '?' at this stage)
    ok, reason = check_color_counts([u_list, r_list, f_list, d_list, l_list, b_list])
    if not ok:
        return None, reason # Reason will mention '?' if that's the issue

    # 2. Brute force check all 4^6 = 4096 orientations
    all_rotations = [0, 1, 2, 3]
    found_valid = False
    best_reason = "No valid orientation found (checked 4096 possibilities)."

    for u_rot, r_rot, f_rot, d_rot, l_rot, b_rot in itertools.product(all_rotations, repeat=6):
        # Rotate faces according to current combination
        u_rotated = rotate_face(u_list, u_rot)
        r_rotated = rotate_face(r_list, r_rot)
        f_rotated = rotate_face(f_list, f_rot)
        d_rotated = rotate_face(d_list, d_rot)
        l_rotated = rotate_face(l_list, l_rot)
        b_rotated = rotate_face(b_list, b_rot)

        # Check if this arrangement is valid
        valid, reason = is_valid_arrangement(
            u_rotated, r_rotated, f_rotated, d_rotated, l_rotated, b_rotated
        )

        if valid:
            # Found a valid orientation! Construct the Kociemba string (URFDLB order, UPPERCASE).
            try:
                final_ordered_list = list(itertools.chain(
                    u_rotated, r_rotated, f_rotated, d_rotated, l_rotated, b_rotated
                ))

                # Convert lowercase colors to uppercase face chars needed by kociemba.
                kociemba_str = "".join(COLOR_TO_FACE_CHAR[c] for c in final_ordered_list)

                # Final sanity check on length
                if len(kociemba_str) != 54:
                     # This indicates an internal logic error if counts passed
                     best_reason = "Internal error: Generated Kociemba string is not 54 chars."
                     continue # Should not happen if validation is correct

                return kociemba_str, None # Success

            except KeyError as e:
                 # This can happen if a non-standard char slipped through checks somehow
                 best_reason = f"Internal error: Invalid color character '{e}' during Kociemba string conversion."
                 continue # Try other orientations just in case
            except Exception as e:
                 best_reason = f"Internal error during final string conversion: {e}"
                 continue

        # Store the reason if this combination was invalid
        elif reason and not found_valid: # Keep the first specific reason encountered
             # Don't overwrite a specific reason with a generic '?' failure
             if "Placeholder '?' found" not in reason:
                best_reason = reason


    # If loop finishes without returning, no valid orientation was found
    return None, best_reason