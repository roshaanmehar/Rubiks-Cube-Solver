def rotate_face_cw(face_stickers):
    """
    Rotate a 3×3 face 90 degrees clockwise.
    face_stickers is a list of length 9 representing:
       0 1 2
       3 4 5
       6 7 8
    Returns a new list representing the rotated face.
    """
    # Mapping for 90° clockwise rotation:
    return [
        face_stickers[6],  # old index 6 -> new index 0
        face_stickers[3],  # old index 3 -> new index 1
        face_stickers[0],  # old index 0 -> new index 2
        face_stickers[7],  # old index 7 -> new index 3
        face_stickers[4],  # old index 4 -> new index 4 (center remains center)
        face_stickers[1],  # old index 1 -> new index 5
        face_stickers[8],  # old index 8 -> new index 6
        face_stickers[5],  # old index 5 -> new index 7
        face_stickers[2],  # old index 2 -> new index 8
    ]

# Opposite colors rule: no piece can contain a pair of opposites.
OPPOSITE = {
    'W': 'Y', 'Y': 'W',
    'G': 'B', 'B': 'G',
    'R': 'O', 'O': 'R'
}

# We will define the 12 edges and 8 corners in terms of (face_label, index_on_that_face).
# The labeling of indices is as follows for each face:
#
#   0 1 2
#   3 4 5
#   6 7 8
#
# We arrange the net in “unfolded” form:
#          U0 U1 U2
#          U3 U4 U5
#          U6 U7 U8
# L0 L1 L2  F0 F1 F2  R0 R1 R2  B0 B1 B2
# L3 L4 L5  F3 F4 F5  R3 R4 R5  B3 B4 B5
# L6 L7 L8  F6 F7 F8  R6 R7 R8  B6 B7 B8
#          D0 D1 D2
#          D3 D4 D5
#          D6 D7 D8
#
# Then we define each edge by matching the squares that physically share a border.
#
EDGES = [
    # U-F edge
    (('U', 6), ('F', 0)),
    (('U', 7), ('F', 1)),
    (('U', 8), ('F', 2)),

    # U-R edge
    (('U', 2), ('R', 0)),
    (('U', 5), ('R', 3)),
    (('U', 8), ('R', 6)),  # Note: U8 is also part of U-F edge above, but that's okay

    # U-L edge
    (('U', 0), ('L', 2)),
    (('U', 3), ('L', 5)),
    (('U', 6), ('L', 8)),

    # U-B edge
    (('U', 1), ('B', 2)),
    (('U', 4), ('B', 5)),
    (('U', 7), ('B', 8)),

    # F-R edge
    (('F', 2), ('R', 0)),
    (('F', 5), ('R', 1)),
    (('F', 8), ('R', 2)),

    # R-B edge
    (('R', 2), ('B', 0)),
    (('R', 5), ('B', 3)),
    (('R', 8), ('B', 6)),

    # B-L edge
    (('B', 2), ('L', 0)),
    (('B', 5), ('L', 3)),
    (('B', 8), ('L', 6)),

    # L-F edge
    (('L', 2), ('F', 0)),
    (('L', 5), ('F', 3)),
    (('L', 8), ('F', 6)),

    # D-F edge
    (('D', 0), ('F', 6)),
    (('D', 1), ('F', 7)),
    (('D', 2), ('F', 8)),

    # D-R edge
    (('D', 2), ('R', 6)),
    (('D', 5), ('R', 7)),
    (('D', 8), ('R', 8)),

    # D-L edge
    (('D', 0), ('L', 8)),
    (('D', 3), ('L', 7)),
    (('D', 6), ('L', 6)),

    # D-B edge
    (('D', 1), ('B', 8)),
    (('D', 4), ('B', 7)),
    (('D', 7), ('B', 6)),
]

# Similarly, define corners as sets of three squares that physically meet.
CORNERS = [
    # Top layer corners
    (('U', 0), ('L', 2), ('B', 2)),
    (('U', 2), ('B', 0), ('R', 0)),
    (('U', 6), ('L', 8), ('F', 0)),
    (('U', 8), ('F', 2), ('R', 6)),

    # Bottom layer corners
    (('D', 0), ('L', 8), ('F', 6)),
    (('D', 2), ('F', 8), ('R', 6)),
    (('D', 6), ('L', 6), ('B', 8)),
    (('D', 8), ('B', 6), ('R', 8)),
]

def colors_are_conflicting(*color_list):
    """
    Return True if there's any conflict among the given colors:
    - Duplicate color (e.g., 'R', 'R')
    - Opposite color pair in the same piece (e.g. 'W' and 'Y')
    """
    # If you have duplicates, that’s a conflict.
    if len(set(color_list)) < len(color_list):
        return True
    # If any pair is opposite, conflict.
    for c in color_list:
        for d in color_list:
            if d == OPPOSITE.get(c, None):
                return True
    return False

def check_cube(cube_dict):
    """
    Given a dictionary:
       cube_dict['U'] = list of 9 color chars,
       cube_dict['R'] = ...
       ... etc. ...
    Check all edges and corners for conflicts.
    If no conflicts, return True. Otherwise False.
    """

    # Check edges
    for (f1_idx, f2_idx) in EDGES:
        (face1, index1) = f1_idx
        (face2, index2) = f2_idx
        c1 = cube_dict[face1][index1]
        c2 = cube_dict[face2][index2]
        if colors_are_conflicting(c1, c2):
            return False

    # Check corners
    for trip in CORNERS:
        colors = [cube_dict[f][i] for (f, i) in trip]
        if colors_are_conflicting(*colors):
            return False

    # Also check total color counts == 9 each
    color_count = {}
    for face in ['U','F','R','B','L','D']:
        for c in cube_dict[face]:
            color_count[c] = color_count.get(c, 0) + 1
    # We want exactly 6 distinct colors, each with 9 occurrences:
    # but if you want to be more flexible, skip this check or adapt it
    for c in ['W','Y','G','B','R','O']:
        if color_count.get(c, 0) != 9:
            return False

    return True

def all_rotations_of_face(face_stickers):
    """
    Generate all 4 possible 90-degree increments for a face.
    Yields tuples: (0, face_stickers), (1, rotated_once), (2, rotated_twice), (3, rotated_thrice).
    The first element in each tuple is how many times we rotated clockwise.
    """
    current = face_stickers
    yield (0, current)
    for r in range(1,4):
        current = rotate_face_cw(current)
        yield (r, current)

def solve_cube_orientation(initial_face_data):
    """
    initial_face_data is a dict with keys like 'front','right','back','left','up','down',
    each being a length-9 list of color chars.
    
    Steps:
      1) Identify which face is W-center, Y-center, G-center, B-center, R-center, O-center.
      2) Rename them to the standard 'U','D','F','B','R','L'.
      3) Try all 4 rotations for each of the 6 faces (4^6=4096 combos).
      4) Return the first orientation that meets the constraints.
    """
    # 1) Identify center color (index 4).
    # We'll build a face_map that goes from color -> old_label
    center_to_label = {}
    for old_label in initial_face_data:
        center_color = initial_face_data[old_label][4]
        center_to_label[center_color] = old_label

    # We expect to find: W, Y, G, B, R, O each in center_to_label
    required_centers = ['W','Y','G','B','R','O']
    for rc in required_centers:
        if rc not in center_to_label:
            raise ValueError(f"Center color {rc} not found in the provided face data! Can't proceed.")

    # 2) Build a new dict with standard keys 'U','F','R','B','L','D'.
    #    We pull the data from initial_face_data but rename them based on center color:
    #       face with center W -> 'U'
    #       face with center Y -> 'D'
    #       face with center G -> 'F'
    #       face with center B -> 'B'
    #       face with center R -> 'R'
    #       face with center O -> 'L'
    new_cube = {
        'U': list(initial_face_data[center_to_label['W']]),
        'D': list(initial_face_data[center_to_label['Y']]),
        'F': list(initial_face_data[center_to_label['G']]),
        'B': list(initial_face_data[center_to_label['B']]),
        'R': list(initial_face_data[center_to_label['R']]),
        'L': list(initial_face_data[center_to_label['O']]),
    }

    # 3) Try all 4 orientations for each face, in a brute-force manner.
    #    That is, we have 6 faces, each can be in 4 possible rotations -> 4^6 = 4096.
    #    We'll just do a 6-level nested loop or a quick recursive approach.

    faces_in_order = ['U','F','R','B','L','D']

    # We'll define a small recursive function that assigns orientation to each face.
    def backtrack(face_index, current_cube):
        if face_index == len(faces_in_order):
            # All faces oriented. Check constraints.
            if check_cube(current_cube):
                return current_cube
            else:
                return None

        face_label = faces_in_order[face_index]
        original_face_data = current_cube[face_label]

        for (rot_count, rotated_face) in all_rotations_of_face(original_face_data):
            # Temporarily assign the rotated version
            current_cube[face_label] = rotated_face
            result = backtrack(face_index+1, current_cube)
            if result is not None:
                return result  # found a valid orientation
            # Otherwise revert and keep trying
        # revert
        current_cube[face_label] = original_face_data
        return None

    solution = backtrack(0, new_cube)
    if solution is None:
        raise ValueError("No valid orientation found under the given constraints!")
    return solution


# -----------------
# EXAMPLE USAGE
if __name__ == "__main__":

    face_data = {
        'front': ['Y','B','W','W','G','R','Y','W','W'],
        'right': ['R','B','B','O','R','Y','B','Y','R'],
        'back':  ['R','G','Y','B','B','G','W','Y','G'],
        'left':  ['O','O','G','Y','O','B','W','G','W'],
        'up':    ['B','G','O','B','W','W','G','R','O'],
        'down':  ['B','G','R','O','Y','R','O','O','G']
    }

    final_cube = solve_cube_orientation(face_data)

    print("Found a valid orientation!")
    for face_key in ['U','F','R','B','L','D']:
        print(face_key, "->", final_cube[face_key])
