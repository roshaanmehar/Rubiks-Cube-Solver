import itertools
import json
import sys # Used for flushing print statements if needed

# ------------------------------------------------------------
# 1. Basic Cube Definitions
# ------------------------------------------------------------

# Define opposite colors - cannot be on the same piece
opposites = {
    'w': 'y', 'y': 'w',
    'r': 'o', 'o': 'r',
    'g': 'b', 'b': 'g'
}
# Define the set of valid colors
valid_colors = set(opposites.keys())  # {'w', 'y', 'r', 'o', 'g', 'b'}

# ------------------------------------------------------------
# 2. The "Master List" of Unique Cube Pieces
# ------------------------------------------------------------
# We use 'frozenset' because the order of colors on a piece doesn't matter
# (e.g., {'w','r','g'} is the same corner piece as {'g','w','r'}),
# and frozensets can be stored inside other sets.

CANONICAL_CORNERS = {
    # White corners
    frozenset({'w', 'r', 'g'}), frozenset({'w', 'g', 'o'}),
    frozenset({'w', 'o', 'b'}), frozenset({'w', 'b', 'r'}),
    # Yellow corners
    frozenset({'y', 'g', 'r'}), frozenset({'y', 'o', 'g'}),
    frozenset({'y', 'b', 'o'}), frozenset({'y', 'r', 'b'}),
}

CANONICAL_EDGES = {
    # White edges
    frozenset({'w', 'r'}), frozenset({'w', 'g'}), frozenset({'w', 'o'}), frozenset({'w', 'b'}),
    # Middle layer edges
    frozenset({'r', 'g'}), frozenset({'g', 'o'}), frozenset({'o', 'b'}), frozenset({'b', 'r'}),
    # Yellow edges
    frozenset({'y', 'r'}), frozenset({'y', 'g'}), frozenset({'y', 'o'}), frozenset({'y', 'b'}),
}

# Double-check we defined the right number of pieces
assert len(CANONICAL_CORNERS) == 8, "Should have 8 unique corners"
assert len(CANONICAL_EDGES) == 12, "Should have 12 unique edges"

# ------------------------------------------------------------
# 3. Helper Functions
# ------------------------------------------------------------

def mapColorToFace(faceArr, faceString):
    """Stores the 9-character input string into a face list."""
    if len(faceString) != 9:
        raise ValueError("Input string must be 9 characters only.")
    if not all(c in valid_colors for c in faceString):
         raise ValueError(f"Input string '{faceString}' contains invalid colors.")
    for i in range(9):
        faceArr[i] = faceString[i]

def check_color_counts(faces):
    """Checks if the total count of each color across all faces is exactly 9."""
    all_stickers = []
    for face in faces:
        all_stickers.extend(face)

    if len(all_stickers) != 54:
        print(f"Error: Invalid total number of facelets: {len(all_stickers)}")
        return False

    for color in valid_colors:
        count = all_stickers.count(color)
        if count != 9:
            print(f"Error: Color '{color}' appears {count} times, should be 9.")
            return False
    print("Color counts are correct (9 of each).")
    return True

def rotate_face_90(face):
    """Rotates a single face 90 degrees clockwise."""
    # Indices: 0 1 2 / 3 4 5 / 6 7 8
    # New Pos: 6 3 0 / 7 4 1 / 8 5 2
    return [
        face[6], face[3], face[0],
        face[7], face[4], face[1],
        face[8], face[5], face[2]
    ]

def rotate_face(face, times):
    """Rotates a face N times (N * 90 degrees clockwise)."""
    result = face[:] # Make a copy
    for _ in range(times % 4): # % 4 handles rotations >= 4
        result = rotate_face_90(result)
    return result

def get_pieces_from_state(u_face, r_face, f_face, d_face, l_face, b_face):
    """
    "Builds" all 8 corners and 12 edges from the current view of the cube faces.
    Returns them as two sets of frozensets (sets of colors).
    Uses standard URFDLB notation for piece locations.
    """
    corners_frozensets = set()
    edges_frozensets = set()

    # Define where each piece's stickers are located on the faces
    # Format: (Face1[index], Face2[index], Face3[index]) for corners
    #         (Face1[index], Face2[index]) for edges
    # Indices are 0..8 for each face. URFDLB = White, Red, Green, Yellow, Orange, Blue faces.

    corner_locations = [
        (u_face[8], r_face[0], f_face[2]), # URF (Up-Right-Front)
        (u_face[6], f_face[0], l_face[0]), # UFL
        (u_face[0], l_face[2], b_face[0]), # ULB
        (u_face[2], b_face[2], r_face[2]), # UBR
        (d_face[2], f_face[8], r_face[6]), # DFR
        (d_face[0], l_face[6], f_face[6]), # DLF
        (d_face[6], b_face[8], l_face[8]), # DBL
        (d_face[8], r_face[8], b_face[6]), # DRB
    ]
    for c1, c2, c3 in corner_locations:
        piece = frozenset({c1, c2, c3})
        if len(piece) != 3: # Check if colors are distinct
             raise ValueError(f"Invalid corner piece formed with colors: {c1}, {c2}, {c3} (maybe duplicate or missing color)")
        corners_frozensets.add(piece)

    edge_locations = [
        (u_face[7], f_face[1]), # UF (Up-Front)
        (u_face[5], r_face[1]), # UR
        (u_face[1], b_face[1]), # UB
        (u_face[3], l_face[1]), # UL
        (d_face[1], f_face[7]), # DF
        (d_face[5], r_face[7]), # DR
        (d_face[7], b_face[7]), # DB
        (d_face[3], l_face[7]), # DL
        (f_face[5], r_face[3]), # FR
        (f_face[3], l_face[5]), # FL
        (b_face[5], l_face[3]), # BL  <- Corrected index B[5] not B[3]
        (b_face[3], r_face[5]), # BR  <- Corrected index B[3] not B[5]
    ]
    for e1, e2 in edge_locations:
        piece = frozenset({e1, e2})
        if len(piece) != 2: # Check if colors are distinct
             raise ValueError(f"Invalid edge piece formed with colors: {e1}, {e2} (maybe duplicate or missing color)")
        edges_frozensets.add(piece)

    return corners_frozensets, edges_frozensets

# ------------------------------------------------------------
# 4. The Main Orientation Finding Function
# ------------------------------------------------------------

def find_the_correct_orientation(u_in, r_in, f_in, d_in, l_in, b_in):
    """
    Tries all 4096 rotation combinations of the input faces.
    Finds the SINGLE combination where:
      1. Center pieces match the standard URFDLB layout (w,r,g,y,o,b).
      2. The set of all 8 corners and 12 edges formed EXACTLY matches
         the unique pieces of a standard Rubik's cube.
    Returns a dictionary with details of the correct orientation, or None.
    """
    print("\nStarting search for the single correct orientation...")
    print("This will check up to 4096 possibilities.")

    # 1. Check initial overall color counts
    if not check_color_counts([u_in, r_in, f_in, d_in, l_in, b_in]):
        print("Cannot proceed due to incorrect total color counts.")
        return None

    correct_orientation_info = None
    found_count = 0
    checked_count = 0

    # Define the standard middle colors we expect AFTER correct rotation
    expected_centers = ['w', 'r', 'g', 'y', 'o', 'b'] # U R F D L B

    # Iterate through all 4 possible rotations (0, 90, 180, 270 deg) for each of the 6 faces
    # 4 * 4 * 4 * 4 * 4 * 4 = 4096 combinations
    all_rotations = [0, 1, 2, 3]
    for index, (u_rot, r_rot, f_rot, d_rot, l_rot, b_rot) in enumerate(
        itertools.product(all_rotations, repeat=6)
    ):
        checked_count += 1
        if checked_count % 500 == 0: # Print progress update
             print(f"  Checked {checked_count}/4096 combinations...")
             sys.stdout.flush() # Make sure message appears immediately


        # Rotate the input faces according to this combination
        u_rotated = rotate_face(u_in, u_rot)
        r_rotated = rotate_face(r_in, r_rot)
        f_rotated = rotate_face(f_in, f_rot)
        d_rotated = rotate_face(d_in, d_rot)
        l_rotated = rotate_face(l_in, l_rot)
        b_rotated = rotate_face(b_in, b_rot)

        # --- Quick Check 1: Do the Center pieces match standard layout? ---
        current_centers = [
            u_rotated[4], r_rotated[4], f_rotated[4],
            d_rotated[4], l_rotated[4], b_rotated[4]
        ]
        if current_centers != expected_centers:
            continue # If centers don't match, this orientation is wrong, try next combo

        # --- If Centers are OK, proceed to the Full Piece Check ---
        try:
            # "Build" all corners and edges from this specific rotated view
            extracted_corners, extracted_edges = get_pieces_from_state(
                u_rotated, r_rotated, f_rotated, d_rotated, l_rotated, b_rotated
            )

            # --- The CRUCIAL Check 2: Does the set of pieces match the master list? ---
            if extracted_corners == CANONICAL_CORNERS and extracted_edges == CANONICAL_EDGES:
                # SUCCESS! This orientation has the right centers AND the exact right set of unique pieces.
                print(f"\nFound globally consistent orientation at index {index}!")
                found_count += 1

                # Construct the standard 54-character state string (URFDLB order)
                final_state_string = (
                    "".join(u_rotated) + "".join(r_rotated) + "".join(f_rotated) +
                    "".join(d_rotated) + "".join(l_rotated) + "".join(b_rotated)
                )

                # Store the details of this correct orientation
                correct_orientation_info = {
                    "combination_index": index,
                    "rotations": (u_rot, r_rot, f_rot, d_rot, l_rot, b_rot),
                    "state_string": final_state_string,
                    "faces": { # Store the correctly oriented faces
                        "u": "".join(u_rotated), "r": "".join(r_rotated), "f": "".join(f_rotated),
                        "d": "".join(d_rotated), "l": "".join(l_rotated), "b": "".join(b_rotated)
                     }
                }

                # If we assume only ONE correct state is possible for a real cube,
                # we can stop searching now. Remove 'break' if you want to check all 4096 anyway.
                break

        except ValueError as e:
             # This catches errors if get_pieces_from_state found an impossible piece
             # (like two reds on one corner) from the rotated input.
             # This usually indicates an error in the *initial* input strings.
             # print(f"Warning: Combo index {index} skipped due to invalid piece: {e}")
             continue # Try the next combination

    # --- After checking all combinations ---
    print(f"Finished checking {checked_count} combinations.")

    if correct_orientation_info:
        if found_count > 1:
             print(f"Warning: Found {found_count} orientations passing all checks. This is unexpected.")
        return correct_orientation_info
    else:
        print("No orientation found that matches standard centers AND the canonical set of pieces.")
        print("Possible reasons:")
        print("  - An error in the initial input face strings.")
        print("  - The cube state described is physically impossible (unsolvable).")
        return None

# ------------------------------------------------------------
# 5. Running the Code
# ------------------------------------------------------------

# --- Define the 6 faces as lists (will be filled by input) ---
u_face_input = [None]*9  # Up (should be white center)
r_face_input = [None]*9  # Right (should be red center)
f_face_input = [None]*9  # Front (should be green center)
d_face_input = [None]*9  # Down (should be yellow center)
l_face_input = [None]*9  # Left (should be orange center)
b_face_input = [None]*9  # Back (should be blue center)

# --- !!! ENTER YOUR CUBE'S FACE STRINGS HERE !!! ---
# Read the colors top-left to bottom-right for each face.
# It DOESN'T MATTER how the faces are twisted when you read them,
# as long as you correctly identify which physical face is Up, Front, etc.
# Example input (replace with your actual cube state):
try:
    mapColorToFace(u_face_input, "wywywyywy") # White center face
    mapColorToFace(r_face_input, "rrrrrrrob") # Red center face
    mapColorToFace(f_face_input, "ggogggbgg") # Green center face
    mapColorToFace(d_face_input, "wwywywyyw") # Yellow center face
    mapColorToFace(l_face_input, "oroooogoo") # Orange center face
    mapColorToFace(b_face_input, "bbbbbbgbr") # Blue center face

    # --- Print the raw input ---
    print("--- Initial Raw Input ---")
    print(f"Input Up    (W): {''.join(u_face_input)}")
    print(f"Input Right (R): {''.join(r_face_input)}")
    print(f"Input Front (G): {''.join(f_face_input)}")
    print(f"Input Down  (Y): {''.join(d_face_input)}")
    print(f"Input Left  (O): {''.join(l_face_input)}")
    print(f"Input Back  (B): {''.join(b_face_input)}")

    # --- Run the orientation finding function ---
    result_data = find_the_correct_orientation(
        u_face_input, r_face_input, f_face_input,
        d_face_input, l_face_input, b_face_input
    )

    # --- Print the final results ---
    if result_data:
        print("\n--- Found the Correct Orientation ---")
        print(f"Internal combination index: {result_data['combination_index']}")
        rots = result_data['rotations']
        print(f"Required rotations (U,R,F,D,L,B * 90deg): ({rots[0]},{rots[1]},{rots[2]},{rots[3]},{rots[4]},{rots[5]})")
        print(f"\nCorrected Cube State String (URFDLB order):")
        print(result_data['state_string'])
        print("\nCorrected Faces (after applying rotations):")
        print(f"  Up    (W): {result_data['faces']['u']}")
        print(f"  Right (R): {result_data['faces']['r']}")
        print(f"  Front (G): {result_data['faces']['f']}")
        print(f"  Down  (Y): {result_data['faces']['d']}")
        print(f"  Left  (O): {result_data['faces']['l']}")
        print(f"  Back  (B): {result_data['faces']['b']}")
    else:
        print("\n--- Failed to find a single correct orientation ---")

except ValueError as e:
    print(f"\nInput Error: {e}")
    print("Please correct the input face strings and try again.")