import numpy as np

def strmat(matstring):
    """Converts a string representation of a matrix to a NumPy array."""
    matrix = [list(row.strip()) for row in matstring.strip().split("\n")]
    return np.array(matrix)

def rotate_matrix_clockwise(matrix):
    """Rotate a matrix 90 degrees clockwise."""
    return np.rot90(matrix, k=3)  # k=3 is equivalent to k=-1 (counter-clockwise)

def rotate_matrix_counter_clockwise(matrix):
    """Rotate a matrix 90 degrees counter-clockwise."""
    return np.rot90(matrix)

def get_corner(face_matrices, corner_indices):
    """Get the colors at a specific corner across multiple faces."""
    colors = []
    for face, indices in corner_indices:
        i, j = indices
        colors.append(face_matrices[face][i, j])
    return colors

def get_edge(face_matrices, edge_indices):
    """Get the colors at a specific edge across multiple faces."""
    colors = []
    for face, indices in edge_indices:
        i, j = indices
        colors.append(face_matrices[face][i, j])
    return colors

def is_valid_combination(colors):
    """Check if a combination of colors is valid (no opposites)."""
    opposites = {
        'y': 'w', 'w': 'y',
        'b': 'g', 'g': 'b',
        'o': 'r', 'r': 'o'
    }
    
    # Check for duplicates
    if len(colors) != len(set(colors)):
        return False
    
    # Check for opposites
    for i in range(len(colors)):
        for j in range(i + 1, len(colors)):
            if opposites.get(colors[i]) == colors[j]:
                return False
    
    return True

def validate_cube(face_matrices):
    """Validate all corners and edges of the cube."""
    # Define the corner positions (face, (i, j))
    corners = [
        # Top layer corners (white face)
        [('w', (0, 0)), ('o', (0, 2)), ('b', (0, 0))],  # w-o-b
        [('w', (0, 2)), ('b', (0, 2)), ('r', (0, 0))],  # w-b-r
        [('w', (2, 2)), ('r', (0, 2)), ('g', (0, 2))],  # w-r-g
        [('w', (2, 0)), ('g', (0, 0)), ('o', (0, 0))],  # w-g-o
        
        # Bottom layer corners (yellow face)
        [('y', (0, 0)), ('o', (2, 2)), ('g', (2, 0))],  # y-o-g
        [('y', (0, 2)), ('g', (2, 2)), ('r', (2, 2))],  # y-g-r
        [('y', (2, 2)), ('r', (2, 0)), ('b', (2, 2))],  # y-r-b
        [('y', (2, 0)), ('b', (2, 0)), ('o', (2, 0))],  # y-b-o
    ]
    
    # Define the edge positions
    edges = [
        # Top layer edges
        [('w', (0, 1)), ('b', (0, 1))],  # w-b
        [('w', (1, 2)), ('r', (0, 1))],  # w-r
        [('w', (2, 1)), ('g', (0, 1))],  # w-g
        [('w', (1, 0)), ('o', (0, 1))],  # w-o
        
        # Middle layer edges
        [('b', (1, 2)), ('r', (1, 0))],  # b-r
        [('r', (1, 2)), ('g', (1, 2))],  # r-g
        [('g', (1, 0)), ('o', (1, 2))],  # g-o
        [('o', (1, 0)), ('b', (1, 0))],  # o-b
        
        # Bottom layer edges
        [('y', (0, 1)), ('g', (2, 1))],  # y-g
        [('y', (1, 2)), ('r', (2, 1))],  # y-r
        [('y', (2, 1)), ('b', (2, 1))],  # y-b
        [('y', (1, 0)), ('o', (2, 1))],  # y-o
    ]
    
    # Check all corners
    for corner in corners:
        corner_colors = get_corner(face_matrices, corner)
        if not is_valid_combination(corner_colors):
            return False, f"Invalid corner: {corner_colors}"
    
    # Check all edges
    for edge in edges:
        edge_colors = get_edge(face_matrices, edge)
        if not is_valid_combination(edge_colors):
            return False, f"Invalid edge: {edge_colors}"
    
    return True, "Cube is valid"

def solve_cube(face_matrices):
    """Attempt to solve the cube by rotating faces."""
    # Start with white face as reference
    # First handle the white-blue-orange corner
    attempts = 0
    max_attempts = 20  # Prevent infinite loops
    
    while attempts < max_attempts:
        # Check white-blue-orange corner
        wbo_corner = get_corner(face_matrices, [('w', (0, 0)), ('b', (0, 0)), ('o', (0, 2))])
        if not is_valid_combination(wbo_corner):
            # Try rotating blue face
            face_matrices['b'] = rotate_matrix_clockwise(face_matrices['b'])
            continue  # Recheck the corner
        
        # Check white-blue-red corner
        wbr_corner = get_corner(face_matrices, [('w', (0, 2)), ('b', (0, 2)), ('r', (0, 0))])
        if not is_valid_combination(wbr_corner):
            # Try rotating red face
            face_matrices['r'] = rotate_matrix_clockwise(face_matrices['r'])
            # Recheck first corner after rotation
            wbo_corner = get_corner(face_matrices, [('w', (0, 0)), ('b', (0, 0)), ('o', (0, 2))])
            if not is_valid_combination(wbo_corner):
                # If first corner now invalid, undo red rotation and try blue
                face_matrices['r'] = rotate_matrix_counter_clockwise(face_matrices['r'])
                face_matrices['b'] = rotate_matrix_clockwise(face_matrices['b'])
                continue
            continue  # Recheck the corner
        
        # Check white-red-green corner
        wrg_corner = get_corner(face_matrices, [('w', (2, 2)), ('r', (0, 2)), ('g', (0, 2))])
        if not is_valid_combination(wrg_corner):
            # Try rotating green face
            face_matrices['g'] = rotate_matrix_clockwise(face_matrices['g'])
            # Recheck previous corners
            if not is_valid_combination(get_corner(face_matrices, [('w', (0, 0)), ('b', (0, 0)), ('o', (0, 2))])) or \
               not is_valid_combination(get_corner(face_matrices, [('w', (0, 2)), ('b', (0, 2)), ('r', (0, 0))])):
                # If previous corners now invalid, undo green rotation and try red
                face_matrices['g'] = rotate_matrix_counter_clockwise(face_matrices['g'])
                face_matrices['r'] = rotate_matrix_clockwise(face_matrices['r'])
                continue
            continue  # Recheck the corner
        
        # Check white-green-orange corner
        wgo_corner = get_corner(face_matrices, [('w', (2, 0)), ('g', (0, 0)), ('o', (0, 0))])
        if not is_valid_combination(wgo_corner):
            # Try rotating orange face
            face_matrices['o'] = rotate_matrix_clockwise(face_matrices['o'])
            # Recheck previous corners
            if not is_valid_combination(get_corner(face_matrices, [('w', (0, 0)), ('b', (0, 0)), ('o', (0, 2))])) or \
               not is_valid_combination(get_corner(face_matrices, [('w', (0, 2)), ('b', (0, 2)), ('r', (0, 0))])) or \
               not is_valid_combination(get_corner(face_matrices, [('w', (2, 2)), ('r', (0, 2)), ('g', (0, 2))])):
                # If previous corners now invalid, undo orange rotation and try white as last resort
                face_matrices['o'] = rotate_matrix_counter_clockwise(face_matrices['o'])
                face_matrices['w'] = rotate_matrix_clockwise(face_matrices['w'])
                continue
            continue  # Recheck the corner
        
        # Now check edges after corners are validated
        # We'll check each edge and rotate faces as needed
        for edge_def in [
            # Top layer edges
            [('w', (0, 1)), ('b', (0, 1))],  # w-b
            [('w', (1, 2)), ('r', (0, 1))],  # w-r
            [('w', (2, 1)), ('g', (0, 1))],  # w-g
            [('w', (1, 0)), ('o', (0, 1))],  # w-o
            
            # Middle layer edges
            [('b', (1, 2)), ('r', (1, 0))],  # b-r
            [('r', (1, 2)), ('g', (1, 2))],  # r-g
            [('g', (1, 0)), ('o', (1, 2))],  # g-o
            [('o', (1, 0)), ('b', (1, 0))],  # o-b
        ]:
            edge_colors = get_edge(face_matrices, edge_def)
            if not is_valid_combination(edge_colors):
                # Based on which edge is invalid, rotate the appropriate face
                face1, _ = edge_def[0]
                face2, _ = edge_def[1]
                
                # Try rotating the first face
                face_matrices[face1] = rotate_matrix_clockwise(face_matrices[face1])
                
                # Check if this resolves all previous valid corners and edges
                if not validate_cube(face_matrices)[0]:
                    # If not, undo and try the second face
                    face_matrices[face1] = rotate_matrix_counter_clockwise(face_matrices[face1])
                    face_matrices[face2] = rotate_matrix_clockwise(face_matrices[face2])
                    
                    if not validate_cube(face_matrices)[0]:
                        # If still not resolved, this approach won't work
                        # For simplicity, we'll undo and continue to next attempt
                        face_matrices[face2] = rotate_matrix_counter_clockwise(face_matrices[face2])
                continue
        
        # Finally, handle the yellow face
        # If all white corners and edges are valid, we can now adjust the yellow face
        yellow_corners = [
            [('y', (0, 0)), ('o', (2, 2)), ('g', (2, 0))],  # y-o-g
            [('y', (0, 2)), ('g', (2, 2)), ('r', (2, 2))],  # y-g-r
            [('y', (2, 2)), ('r', (2, 0)), ('b', (2, 2))],  # y-r-b
            [('y', (2, 0)), ('b', (2, 0)), ('o', (2, 0))],  # y-b-o
        ]
        
        yellow_edges = [
            [('y', (0, 1)), ('g', (2, 1))],  # y-g
            [('y', (1, 2)), ('r', (2, 1))],  # y-r
            [('y', (2, 1)), ('b', (2, 1))],  # y-b
            [('y', (1, 0)), ('o', (2, 1))],  # y-o
        ]
        
        # Check yellow corners and rotate yellow face if needed
        for corner in yellow_corners:
            corner_colors = get_corner(face_matrices, corner)
            if not is_valid_combination(corner_colors):
                face_matrices['y'] = rotate_matrix_clockwise(face_matrices['y'])
                break
        
        # Check yellow edges
        for edge in yellow_edges:
            edge_colors = get_edge(face_matrices, edge)
            if not is_valid_combination(edge_colors):
                face_matrices['y'] = rotate_matrix_clockwise(face_matrices['y'])
                break
        
        # Check if the entire cube is valid now
        is_valid, message = validate_cube(face_matrices)
        if is_valid:
            return True, face_matrices
        
        attempts += 1
    
    return False, "Could not solve the cube within the maximum number of attempts"

def matrix_to_string(face_matrices):
    """Convert face matrices to a single string in URFDLB order."""
    # URFDLB order corresponds to wrgyob order
    order = ['w', 'r', 'g', 'y', 'o', 'b']
    result = ""
    
    for face in order:
        for i in range(3):
            for j in range(3):
                result += face_matrices[face][i, j]
    
    return result

# Main execution
def main():
    # Parse the input matrices
    red_mat = strmat("""www
wrr
yyw""")

    blue_mat = strmat("""rbb
gbg
ggb""")

    orange_mat = strmat("""wwy
bob
grr""")

    white_mat = strmat("""boo
ywr
ggb""")

    yellow_mat = strmat("""oyo
oyo
rbg""")

    green_mat = strmat("""oyy
ogw
rry""")
    
    # Create a dictionary of face matrices
    face_matrices = {
        'w': white_mat,
        'r': red_mat,
        'g': green_mat,
        'y': yellow_mat,
        'o': orange_mat,
        'b': blue_mat
    }
    
    # Display the initial state
    print("Initial state:")
    for face in face_matrices:
        print(f"{face} face:")
        print(np.array2string(face_matrices[face], separator=' '))
        print()
    
    # Validate the initial state
    is_valid, message = validate_cube(face_matrices)
    print(f"Initial validation: {message}")
    
    if not is_valid:
        # Try to solve
        print("Attempting to solve...")
        solved, result = solve_cube(face_matrices)
        
        if solved:
            face_matrices = result
            print("Solved successfully!")
            # Display the solved state
            print("Solved state:")
            for face in face_matrices:
                print(f"{face} face:")
                print(np.array2string(face_matrices[face], separator=' '))
                print()
        else:
            print(f"Failed to solve: {result}")
    
    # Generate the final string
    final_string = matrix_to_string(face_matrices)
    print(f"Final string representation (URFDLB/wrgyob order): {final_string}")

if __name__ == "__main__":
    main()