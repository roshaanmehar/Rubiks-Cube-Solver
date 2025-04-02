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
mapColorToFace(u, "wybgwygyw")
mapColorToFace(r, "rrrgrwyrw")
mapColorToFace(f, "yogwgrbbr")
mapColorToFace(d, "orgyywwgb")
mapColorToFace(l, "gwoooorby")
mapColorToFace(b, "ygobbboob")

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
        return False

    # Must only contain letters from valid_colors
    if any(c not in valid_colors for c in all_stickers):
        return False

    # Check that each color appears exactly 9 times
    for c in valid_colors:
        if all_stickers.count(c) != 9:
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
    for _ in range(times):
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
    Checks all corners & edges in the current orientation.
    Returns (True, None) if valid, or (False, debug_message) if invalid.
    """

    # 8 corners
    corners = [
        (u_face[0] + l_face[0] + b_face[2], "ulb corner"),
        (u_face[2] + r_face[2] + b_face[0], "urb corner"),
        (u_face[6] + l_face[2] + f_face[0], "ulf corner"),
        (u_face[8] + r_face[0] + f_face[2], "urf corner"),
        (d_face[0] + l_face[8] + f_face[6], "dlf corner"),
        (d_face[2] + r_face[6] + f_face[8], "drf corner"),
        (d_face[6] + l_face[7] + b_face[8], "dlb corner"),
        (d_face[8] + r_face[8] + b_face[6], "drb corner"),
    ]

    # 12 edges
    edges = [
        (u_face[1] + b_face[1], "ub edge"),
        (u_face[5] + r_face[1], "ur edge"),
        (u_face[7] + f_face[1], "uf edge"),
        (u_face[3] + l_face[1], "ul edge"),

        (l_face[5] + f_face[3], "lf edge"),
        (r_face[3] + f_face[5], "rf edge"),
        (r_face[5] + b_face[3], "rb edge"),
        (l_face[3] + b_face[5], "lb edge"),

        (d_face[1] + f_face[7], "df edge"),
        (d_face[5] + r_face[7], "dr edge"),
        (d_face[7] + b_face[7], "db edge"),
        (d_face[3] + l_face[7], "dl edge"),
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

    return (True, None)

# ------------------------------------------------------------
# 6) BRUTE FORCE OVER 4^6 FACE ROTATIONS
# ------------------------------------------------------------
def find_valid_orientation(u, r, f, d, l, b):
    """
    1) Check color counts first. If invalid, return None immediately.
    2) Otherwise, iterate over all 4^6 face-rotations.
    3) Stop when a valid arrangement is found.
    4) Save a debug log of every orientation attempt (valid or invalid)
       to 'debug_log.json', including the reason for invalid states.
    """

    # Check color counts
    if not check_color_counts([u, r, f, d, l, b]):
        print("Color counts are invalid (each color must appear exactly 9 times).")
        return None

    # We'll store info about all 4096 states here
    all_states_debug = []

    # We'll keep track of how many combos we tried
    count_checked = 0

    # All possible rotations for each face
    all_rotations = [0,1,2,3]

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
            "valid": valid,
        }
        if valid:
            # If valid, build the final string as requested
            final_str = (
                "".join(u_) +
                "".join(f_) +
                "".join(r_) +
                "".join(d_) +
                "".join(l_) +
                "".join(b_)
            )
            attempt_record["cube_state"] = final_str
            attempt_record["reason"] = "N/A (valid orientation)"

            # Add record to our list
            all_states_debug.append(attempt_record)

            # Save the entire debug log to a JSON file
            with open("debug_log.json", "w") as f_out:
                json.dump(all_states_debug, f_out, indent=2)

            # Print how many combos we checked
            print(f"Solution found after checking {count_checked} combinations.")
            return final_str
        else:
            # If invalid, store reason
            attempt_record["reason"] = reason
            # Add to the debug info
            all_states_debug.append(attempt_record)

    # If we exhaust all 4096 combinations with no success,
    # save the debug log as well
    with open("debug_log.json", "w") as f_out:
        json.dump(all_states_debug, f_out, indent=2)

    print(f"Tried all {count_checked} combinations, no valid orientation found.")
    return None

# ------------------------------------------------------------
# 7) RUN THE SEARCH
# ------------------------------------------------------------
valid_state_str = find_valid_orientation(u, r, f, d, l, b)

if valid_state_str is None:
    print("No valid orientation found.")
else:
    print("Found valid orientation:")
    print(valid_state_str)
