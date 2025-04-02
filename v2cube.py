import itertools

# ------------------------------------------------------------
# 1) DEFINE SIX FACES (each a list of length 9).
#    For simplicity, we hard-code them here via mapColorToFace.
#    You can replace the strings "012345678" with your actual
#    9-character color strings (e.g. "wwwwwwwww", "rrrrrrrrr", etc.)
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

# Example inputs (use your real color strings instead of "012345678")
mapColorToFace(u, "wybgwygyw")
mapColorToFace(r, "rrrgrwyrw")
mapColorToFace(f, "yogwgrbbr")
mapColorToFace(d, "orgyywwgb")
mapColorToFace(l, "gwoooorby")
mapColorToFace(b, "ygobbboob")

# ------------------------------------------------------------
# 2) DEFINE OPPOSITE COLORS & VALID COLORS
#    We'll assume the only valid letters are: w,y,r,o,g,b
#    And that these pairs are opposites:
#      w - y
#      r - o
#      g - b
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
#    We want exactly 9 occurrences of each color for a real cube
# ------------------------------------------------------------
def check_color_counts(faces):
    """
    faces: list of 6 faces, each face is a list of 9 characters
    returns True if each color is found exactly 9 times, else False
    """
    all_stickers = []
    for face in faces:
        all_stickers.extend(face)  # gather all 54 facelets

    # Quick check: must have exactly 54 facelets
    if len(all_stickers) != 54:
        return False

    # Must only contain letters from valid_colors
    for c in all_stickers:
        if c not in valid_colors:
            return False

    # Count each color
    for color in valid_colors:
        if all_stickers.count(color) != 9:
            return False

    return True

# ------------------------------------------------------------
# 4) ROTATION LOGIC
#    We'll need to rotate each face 0, 90, 180, 270 degrees.
#    This helper function returns a new face (9-list) after
#    rotating the original face 'times' * 90 degrees clockwise.
# ------------------------------------------------------------
def rotate_face_90(face):
    """
    Face is a list of 9 items indexed like:
       0 1 2
       3 4 5
       6 7 8
    A 90-degree clockwise rotation re-maps:
       new[0] = old[6]
       new[1] = old[3]
       new[2] = old[0]
       new[3] = old[7]
       new[4] = old[4]
       new[5] = old[1]
       new[6] = old[8]
       new[7] = old[5]
       new[8] = old[2]
    """
    return [
        face[6], face[3], face[0],
        face[7], face[4], face[1],
        face[8], face[5], face[2]
    ]

def rotate_face(face, times):
    """
    Rotate face by times * 90 degrees (clockwise).
    Returns a new list of length 9.
    """
    result = face[:]
    for _ in range(times):
        result = rotate_face_90(result)
    return result

# ------------------------------------------------------------
# 5) CHECK PIECES FOR INVALIDITY
#    We define all corners & edges in terms of face indices.
#    We check each corner or edge to ensure:
#       - no repeated colors
#       - no opposite color pair
# ------------------------------------------------------------
def is_valid_piece(piece_str):
    """
    piece_str: e.g. "wrb" for a corner or "yb" for an edge.
               Must have no repeated colors,
               and must not contain a pair of opposites.
    """
    # No duplicates
    if len(set(piece_str)) != len(piece_str):
        return False

    # Check no pair of opposites
    for c in piece_str:
        for d in piece_str:
            if c != d and opposites.get(c) == d:
                return False

    return True

def is_valid_arrangement(u_face, r_face, f_face, d_face, l_face, b_face):
    """
    Given 6 faces in a specific orientation (each a list of length 9),
    check all corners & edges.
    Returns True if all corners and edges pass the piece checks.
    """

    # 8 corners
    corners = [
        u_face[0] + l_face[0] + b_face[2],  # ulb
        u_face[2] + r_face[2] + b_face[0],  # urb
        u_face[6] + l_face[2] + f_face[0],  # ulf
        u_face[8] + r_face[0] + f_face[2],  # urf
        d_face[0] + l_face[8] + f_face[6],  # dlf
        d_face[2] + r_face[6] + f_face[8],  # drf
        d_face[6] + l_face[7] + b_face[8],  # dlb
        d_face[8] + r_face[8] + b_face[6],  # drb
    ]

    # 12 edges
    edges = [
        u_face[1] + b_face[1],  # ub
        u_face[5] + r_face[1],  # ur
        u_face[7] + f_face[1],  # uf
        u_face[3] + l_face[1],  # ul

        l_face[5] + f_face[3],  # lf
        r_face[3] + f_face[5],  # rf
        r_face[5] + b_face[3],  # rb
        l_face[3] + b_face[5],  # lb

        d_face[1] + f_face[7],  # df
        d_face[5] + r_face[7],  # dr
        d_face[7] + b_face[7],  # db
        d_face[3] + l_face[7],  # dl
    ]

    # Check corners
    for c in corners:
        if not is_valid_piece(c):
            return False

    # Check edges
    for e in edges:
        if not is_valid_piece(e):
            return False

    return True

# ------------------------------------------------------------
# 6) BRUTE-FORCE OVER ALL 4^6 ORIENTATIONS
#    For each face, try 0, 90, 180, 270 rotation. If a valid
#    arrangement is found, output the 54-character result in
#    the order U, F, R, D, L, B (each face indices 0..8).
# ------------------------------------------------------------
def find_valid_orientation(u, r, f, d, l, b):
    # First, check color counts just once; orientation doesn't change counts
    if not check_color_counts([u, r, f, d, l, b]):
        print("Color counts are invalid (each color must appear exactly 9 times).")
        return None

    all_rotations = [0,1,2,3]  # 4 possible orientations

    for u_rot, r_rot, f_rot, d_rot, l_rot, b_rot in itertools.product(all_rotations, repeat=6):
        # Rotate each face
        u_ = rotate_face(u, u_rot)
        r_ = rotate_face(r, r_rot)
        f_ = rotate_face(f, f_rot)
        d_ = rotate_face(d, d_rot)
        l_ = rotate_face(l, l_rot)
        b_ = rotate_face(b, b_rot)

        # Check corners & edges for this orientation
        if is_valid_arrangement(u_, r_, f_, d_, l_, b_):
            # If valid, build the final string in the desired order:
            #  uuuuuuuuu fffffffff rrrrrrrrr ddddddddd lllllllll bbbbbbbbb
            result = (
                "".join(u_) +
                "".join(f_) +
                "".join(r_) +
                "".join(d_) +
                "".join(l_) +
                "".join(b_)
            )
            return result

    # If we exhaust all possibilities without finding a valid orientation
    return None

# ------------------------------------------------------------
# 7) ACTUALLY RUN THE SEARCH AND PRINT RESULT
# ------------------------------------------------------------
valid_state_str = find_valid_orientation(u, r, f, d, l, b)
if valid_state_str is None:
    print("No valid orientation found.")
else:
    print("Found valid orientation:")
    print(valid_state_str)
