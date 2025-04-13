import itertools
import json

# ------------------------------------------------------------
# 1) DEFINE SIX FACES (each a list of length 9).
# ------------------------------------------------------------
u = [None]*9  # Up
r = [None]*9  # Right
f = [None]*9  # Front
d = [None]*9  # Down
l = [None]*9  # Left
b = [None]*9  # Back

def mapColorToFace(faceArr, faceString):
    if len(faceString) != 9:
        raise ValueError("Input string must be 9 characters only.")
    for i in range(9):
        faceArr[i] = faceString[i]

# Example inputs.
# Replace with your own 9-letter color strings that
# match white=up, green=front, blue=back, orange=left,
# red=right, yellow=down, etc.
# --- Example 1: Potentially solvable ---
# mapColorToFace(u, "wywywyywy")
# mapColorToFace(r, "rrrrrrrob")
# mapColorToFace(f, "ggogggbgg")
# mapColorToFace(d, "wwywywyyw")
# mapColorToFace(l, "oogooooro")
# mapColorToFace(b, "bbbbbbgbr")

# --- Example 2: Solved State (should have 1 valid orientation: rotations 0,0,0,0,0,0) ---
mapColorToFace(u, "wywywyywy")
mapColorToFace(r, "rrrrrrrob")
mapColorToFace(f, "ggogggbgg")
mapColorToFace(d, "wwywywyyw")
mapColorToFace(l, "oroooogoo")
mapColorToFace(b, "bbbbbbgbr")


# ------------------------------------------------------------
# 2) DEFINE OPPOSITE COLORS & VALID COLORS
# ------------------------------------------------------------
opposites = {
    'w': 'y',
    'y': 'w',
    'r': 'o',
    'o': 'r',
    'g': 'b',
    'b': 'g'
}
valid_colors = set(opposites.keys())  # {'w','y','r','o','g','b'}

# ------------------------------------------------------------
# 3) CHECK COLOR COUNTS
# ------------------------------------------------------------
def check_color_counts(faces):
    """
    Returns True if each color in {'w','y','r','o','g','b'}
    appears exactly 9 times total among the 54 stickers,
    else returns False.
    """
    all_stickers = []
    for face in faces:
        all_stickers.extend(face)

    # Must have exactly 54 facelets
    if len(all_stickers) != 54:
        print(f"Invalid number of facelets: {len(all_stickers)}")
        return False

    # Must only contain letters from valid_colors
    invalid_colors = [c for c in all_stickers if c not in valid_colors]
    if invalid_colors:
        print(f"Invalid colors found: {set(invalid_colors)}")
        return False

    # Check that each color appears exactly 9 times
    for c in valid_colors:
        count = all_stickers.count(c)
        if count != 9:
            print(f"Color '{c}' appears {count} times instead of 9")
            return False

    return True

# ------------------------------------------------------------
# 4) ROTATION LOGIC (rotate each face 0,90,180,270 degrees).
# ------------------------------------------------------------
def rotate_face_90(face):
    """
    3x3 face layout:
        indices:   0 1 2
                   3 4 5
                   6 7 8
    90° clockwise re-maps:
        new[0] = old[6], new[1] = old[3], new[2] = old[0],
        new[3] = old[7], new[4] = old[4], new[5] = old[1],
        new[6] = old[8], new[7] = old[5], new[8] = old[2].
    """
    return [
        face[6], face[3], face[0],
        face[7], face[4], face[1],
        face[8], face[5], face[2]
    ]

def rotate_face(face, times):
    """
    Rotate a face by `times * 90 degrees` clockwise.
    """
    result = face[:]
    for _ in range(times % 4): # Use modulo 4 to handle rotations >= 4
        result = rotate_face_90(result)
    return result

# ------------------------------------------------------------
# 5) PIECE VALIDATION: corners & edges
# ------------------------------------------------------------
def check_piece_validity(piece_str):
    """
    Return (True, "") if valid;
    or (False, explanation) if invalid.
    """
    # 1) Check no repeated colors
    if len(set(piece_str)) != len(piece_str):
        return (False, f"repeated color in piece '{piece_str}'")

    # 2) Check no pair of opposites
    for c in piece_str:
        for d in piece_str:
            if c != d and opposites.get(c) == d:
                return (False, f"opposite colors '{c}' and '{d}' in piece '{piece_str}'")

    return (True, "")

def is_valid_arrangement(u_face, r_face, f_face, d_face, l_face, b_face):
    """
    Checks centers, all corners & edges in the current orientation.
    Returns (True, None) if valid, or (False, debug_message) if invalid.
    """

    # Check centers first - they must match the standard orientation
    centers = [u_face[4], r_face[4], f_face[4], d_face[4], l_face[4], b_face[4]]
    expected_centers = ['w', 'r', 'g', 'y', 'o', 'b'] # U R F D L B standard centers

    for i, (actual, expected) in enumerate(zip(centers, expected_centers)):
        if actual != expected:
            # Map index to face for clearer message
            face_map = {0: "Up", 1: "Right", 2: "Front", 3: "Down", 4: "Left", 5: "Back"}
            return (False, f"Center {face_map[i]} is '{actual}', expected '{expected}'")


    # 8 corners (indices relative to the standard URFDLB orientation)
    corners = [
        (u_face[0] + l_face[2] + b_face[0], "ulb corner"), # Corrected: u[0], l[2], b[0]
        (u_face[2] + r_face[2] + b_face[2], "urb corner"), # Corrected: u[2], r[2], b[2]
        (u_face[6] + l_face[0] + f_face[0], "ulf corner"), # Corrected: u[6], l[0], f[0]
        (u_face[8] + r_face[0] + f_face[2], "urf corner"), # Corrected: u[8], r[0], f[2]
        (d_face[0] + l_face[6] + f_face[6], "dlf corner"), # Corrected: d[0], l[6], f[6]
        (d_face[2] + r_face[6] + f_face[8], "drf corner"), # Corrected: d[2], r[6], f[8]
        (d_face[6] + l_face[8] + b_face[8], "dlb corner"), # Corrected: d[6], l[8], b[8]
        (d_face[8] + r_face[8] + b_face[6], "drb corner"), # Corrected: d[8], r[8], b[6]
    ]

    # 12 edges (indices relative to the standard URFDLB orientation)
    edges = [
        (u_face[1] + b_face[1], "ub edge"), # Corrected: u[1], b[1]
        (u_face[5] + r_face[1], "ur edge"), # Corrected: u[5], r[1]
        (u_face[7] + f_face[1], "uf edge"), # Corrected: u[7], f[1]
        (u_face[3] + l_face[1], "ul edge"), # Corrected: u[3], l[1]

        (l_face[5] + f_face[3], "lf edge"), # Corrected: l[5], f[3]
        (r_face[3] + f_face[5], "rf edge"), # Corrected: r[3], f[5]
        (r_face[5] + b_face[5], "rb edge"), # Corrected: r[5], b[5]
        (l_face[3] + b_face[3], "lb edge"), # Corrected: l[3], b[3]

        (d_face[1] + f_face[7], "df edge"), # Corrected: d[1], f[7]
        (d_face[5] + r_face[7], "dr edge"), # Corrected: d[5], r[7]
        (d_face[7] + b_face[7], "db edge"), # Corrected: d[7], b[7]
        (d_face[3] + l_face[7], "dl edge"), # Corrected: d[3], l[7]
    ]


    # Check corners
    for piece_str, label in corners:
        ok, reason = check_piece_validity(piece_str)
        if not ok:
            return (False, f"Invalid {label}: {reason}")

    # Check edges
    for piece_str, label in edges:
        ok, reason = check_piece_validity(piece_str)
        if not ok:
            return (False, f"Invalid {label}: {reason}")

    # If all checks pass
    return (True, None)

# ------------------------------------------------------------
# 6) BRUTE FORCE OVER 4^6 FACE ROTATIONS
# ------------------------------------------------------------
def find_valid_orientations(u, r, f, d, l, b): # Renamed function for clarity
    """
    1) Check color counts first. If invalid, return empty list immediately.
    2) Otherwise, iterate over all 4^6 face-rotations.
    3) Collect all valid arrangements found.
    4) Save a debug log of every orientation attempt (valid or invalid)
       to 'debug_log.json', including the reason for invalid states.
    5) Return a list of all valid cube state strings found.
    """

    # Check color counts
    if not check_color_counts([u, r, f, d, l, b]):
        print("Color counts are invalid (each color must appear exactly 9 times).")
        return [] # Return empty list if counts are wrong

    # We'll store info about all 4096 states here
    all_states_debug = []
    # List to store all valid state strings
    valid_solutions = []

    # We'll keep track of how many combos we tried
    count_checked = 0

    # All possible rotations for each face (0=0°, 1=90°, 2=180°, 3=270° clockwise)
    all_rotations = [0, 1, 2, 3]

    # Generate all combinations of rotations (4^6 = 4096)
    for index, (u_rot, r_rot, f_rot, d_rot, l_rot, b_rot) in enumerate(
        itertools.product(all_rotations, repeat=6)
    ):
        count_checked += 1

        # Rotate each face accordingly
        u_ = rotate_face(u, u_rot)
        r_ = rotate_face(r, r_rot)
        f_ = rotate_face(f, f_rot)
        d_ = rotate_face(d, d_rot)
        l_ = rotate_face(l, l_rot)
        b_ = rotate_face(b, b_rot)

        # Check arrangement
        valid, reason = is_valid_arrangement(u_, r_, f_, d_, l_, b_)

        # Build a record of this attempt
        attempt_record = {
            "combination_index": index,
            "rotations": {
                "u_rot": u_rot,
                "r_rot": r_rot,
                "f_rot": f_rot,
                "d_rot": d_rot,
                "l_rot": l_rot,
                "b_rot": b_rot
            },
            "faces_tested": { # Added for better debugging
                "u": "".join(u_),
                "r": "".join(r_),
                "f": "".join(f_),
                "d": "".join(d_),
                "l": "".join(l_),
                "b": "".join(b_)
            },
            "valid": valid,
        }

        if valid:
            # If valid, build the final string as requested
            # Standard URFDLB output string format
            final_str = (
                "".join(u_) +
                "".join(r_) + # R face next
                "".join(f_) + # F face next
                "".join(d_) +
                "".join(l_) +
                "".join(b_)
            )
            attempt_record["cube_state"] = final_str
            attempt_record["reason"] = "N/A (valid orientation)"
            valid_solutions.append(final_str) # Add the valid string to our list
        else:
            # If invalid, store reason
            attempt_record["reason"] = reason

        # Add record to our list regardless of validity for the log
        all_states_debug.append(attempt_record)

    # After checking all combinations, save the entire debug log
    try:
        with open("debug_log.json", "w") as f_out:
            json.dump(all_states_debug, f_out, indent=2)
        print(f"\nChecked all {count_checked} combinations.")
        print(f"Debug log saved to debug_log.json")
    except IOError as e:
        print(f"Error saving debug log: {e}")


    # Return the list of all found valid solutions
    return valid_solutions

# ------------------------------------------------------------
# 7) RUN THE SEARCH
# ------------------------------------------------------------
# Print the initial input state for debugging
print("Initial Input cube state:")
print(f"Up face   (u): {''.join(u)}")
print(f"Right face(r): {''.join(r)}")
print(f"Front face(f): {''.join(f)}")
print(f"Down face (d): {''.join(d)}")
print(f"Left face (l): {''.join(l)}")
print(f"Back face (b): {''.join(b)}")

# Print initial centers for quick check
initial_centers = [u[4], r[4], f[4], d[4], l[4], b[4]]
print(f"\nInitial center colors (U,R,F,D,L,B): {initial_centers}")
print("Expected standard center colors: ['w', 'r', 'g', 'y', 'o', 'b']")


# Run the search
valid_state_strings = find_valid_orientations(u, r, f, d, l, b) # Call the renamed function

# --- Output Results ---
if not valid_state_strings:
    print("\nNo valid orientation found that matches standard center colors and piece rules.")
else:
    print(f"\nFound {len(valid_state_strings)} valid orientation(s):")
    for i, state_str in enumerate(valid_state_strings):
        print(f"Solution {i+1}: {state_str}")

        # Optionally print the faces for the first solution found
        if i == 0:
             print("\nFaces for the first valid solution:")
             print(f"  Up   : {state_str[0:9]}")
             print(f"  Right: {state_str[9:18]}")
             print(f"  Front: {state_str[18:27]}")
             print(f"  Down : {state_str[27:36]}")
             print(f"  Left : {state_str[36:45]}")
             print(f"  Back : {state_str[45:54]}")