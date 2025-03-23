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
        return False, "Contains duplicate colors"
    
    # Check for opposites
    for i in range(len(colors)):
        for j in range(i + 1, len(colors)):
            if opposites.get(colors[i]) == colors[j]:
                return False, f"Contains opposite colors {colors[i]} and {colors[j]}"
    
    return True, "Valid combination"

def print_cube_state(face_matrices, step_name):
    """Print the current state of the cube faces with step name."""
    print(f"\n--- {step_name} ---")
    for face in face_matrices:
        print(f"{face} face:")
        print(np.array2string(face_matrices[face], separator=' '))

def validate_cube(face_matrices, verbose=False):
    """Validate all corners and edges of the cube."""
    # Define the corner positions (face, (i, j))
    corners = [
        # Top layer corners
        [('w', (0, 0)), ('o', (0, 2)), ('b', (0, 0))],  # w-o-b (Top-Left, Back-Left, Left-Top)
        [('w', (0, 2)), ('r', (0, 0)), ('b', (0, 2))],  # w-r-b (Top-Right, Right-Top, Back-Right)
        [('w', (2, 2)), ('g', (0, 2)), ('r', (0, 2))],  # w-g-r (Bottom-Right, Front-Right, Right-Bottom)
        [('w', (2, 0)), ('o', (0, 0)), ('g', (0, 0))],  # w-o-g (Bottom-Left, Left-Bottom, Front-Left)
        
        # Bottom layer corners
        [('y', (0, 0)), ('g', (2, 0)), ('o', (2, 2))],  # y-g-o (Top-Left, Front-Left-Bottom, Left-Bottom-Right)
        [('y', (0, 2)), ('r', (2, 2)), ('g', (2, 2))],  # y-r-g (Top-Right, Right-Bottom-Right, Front-Bottom-Right)
        [('y', (2, 2)), ('b', (2, 2)), ('r', (2, 0))],  # y-b-r (Bottom-Right, Back-Bottom-Right, Right-Top-Right)
        [('y', (2, 0)), ('o', (2, 0)), ('b', (2, 0))],  # y-o-b (Bottom-Left, Left-Top-Right, Back-Bottom-Left)
    ]
    
    # Define the edge positions
    edges = [
        # Top layer edges
        [('w', (0, 1)), ('b', (0, 1))],  # w-b (Top-Center, Back-Top-Center)
        [('w', (1, 2)), ('r', (0, 1))],  # w-r (Right-Center, Right-Top-Center)
        [('w', (2, 1)), ('g', (0, 1))],  # w-g (Bottom-Center, Front-Top-Center)
        [('w', (1, 0)), ('o', (0, 1))],  # w-o (Left-Center, Left-Top-Center)
        
        # Middle layer edges
        [('b', (1, 2)), ('r', (1, 0))],  # b-r (Back-Right-Center, Right-Left-Center)
        [('r', (1, 2)), ('g', (1, 2))],  # r-g (Right-Right-Center, Front-Right-Center)
        [('g', (1, 0)), ('o', (1, 2))],  # g-o (Front-Left-Center, Left-Right-Center)
        [('o', (1, 0)), ('b', (1, 0))],  # o-b (Left-Left-Center, Back-Left-Center)
        
        # Bottom layer edges
        [('y', (0, 1)), ('g', (2, 1))],  # y-g (Top-Center, Front-Bottom-Center)
        [('y', (1, 2)), ('r', (2, 1))],  # y-r (Right-Center, Right-Bottom-Center)
        [('y', (2, 1)), ('b', (2, 1))],  # y-b (Bottom-Center, Back-Bottom-Center)
        [('y', (1, 0)), ('o', (2, 1))],  # y-o (Left-Center, Left-Bottom-Center)
    ]
    
    is_valid = True
    error_messages = []
    
    # Check all corners
    if verbose:
        print("\nChecking corners:")
    
    for i, corner in enumerate(corners):
        corner_colors = get_corner(face_matrices, corner)
        corner_valid, reason = is_valid_combination(corner_colors)
        
        if verbose:
            corner_name = f"Corner {i+1}: {' '.join([f'{face}[{i},{j}]' for face, (i, j) in corner])}"
            print(f"{corner_name} - Colors: {corner_colors} - {'Valid' if corner_valid else 'Invalid: ' + reason}")
        
        if not corner_valid:
            is_valid = False
            error_messages.append(f"Invalid corner {i+1}: {corner_colors} - {reason}")
    
    # Check all edges
    if verbose:
        print("\nChecking edges:")
    
    for i, edge in enumerate(edges):
        edge_colors = get_edge(face_matrices, edge)
        edge_valid, reason = is_valid_combination(edge_colors)
        
        if verbose:
            edge_name = f"Edge {i+1}: {' '.join([f'{face}[{i},{j}]' for face, (i, j) in edge])}"
            print(f"{edge_name} - Colors: {edge_colors} - {'Valid' if edge_valid else 'Invalid: ' + reason}")
        
        if not edge_valid:
            is_valid = False
            error_messages.append(f"Invalid edge {i+1}: {edge_colors} - {reason}")
    
    if is_valid:
        return True, "Cube is valid"
    else:
        return False, ", ".join(error_messages)

def solve_cube_step_by_step(face_matrices):
    """Attempt to solve the cube by rotating faces, with detailed logging."""
    original_matrices = {face: matrix.copy() for face, matrix in face_matrices.items()}
    
    print_cube_state(face_matrices, "Initial State")
    
    # Define corners in the order we want to solve them
    corner_definitions = [
        {
            "name": "White-Orange-Blue (WOB)",
            "indices": [('w', (0, 0)), ('o', (0, 2)), ('b', (0, 0))],
            "rotation_priority": ['o', 'b', 'w']  # Try rotating these faces in this order
        },
        {
            "name": "White-Red-Blue (WRB)",
            "indices": [('w', (0, 2)), ('r', (0, 0)), ('b', (0, 2))],
            "rotation_priority": ['r', 'b', 'w']
        },
        {
            "name": "White-Green-Red (WGR)",
            "indices": [('w', (2, 2)), ('g', (0, 2)), ('r', (0, 2))],
            "rotation_priority": ['g', 'r', 'w']
        },
        {
            "name": "White-Orange-Green (WOG)",
            "indices": [('w', (2, 0)), ('o', (0, 0)), ('g', (0, 0))],
            "rotation_priority": ['o', 'g', 'w']
        }
    ]
    
    # Define edges in a similar way
    edge_definitions = [
        {
            "name": "White-Blue (WB)",
            "indices": [('w', (0, 1)), ('b', (0, 1))],
            "rotation_priority": ['b', 'w']
        },
        {
            "name": "White-Red (WR)",
            "indices": [('w', (1, 2)), ('r', (0, 1))],
            "rotation_priority": ['r', 'w']
        },
        {
            "name": "White-Green (WG)",
            "indices": [('w', (2, 1)), ('g', (0, 1))],
            "rotation_priority": ['g', 'w']
        },
        {
            "name": "White-Orange (WO)",
            "indices": [('w', (1, 0)), ('o', (0, 1))],
            "rotation_priority": ['o', 'w']
        }
    ]
    
    # First, try to solve the top layer corners
    for corner_idx, corner in enumerate(corner_definitions):
        print(f"\n--- Solving {corner['name']} Corner ---")
        
        max_rotations = 3  # Maximum rotations per face
        solved = False
        
        for face in corner["rotation_priority"]:
            rotations = 0
            while rotations < max_rotations and not solved:
                corner_colors = get_corner(face_matrices, corner["indices"])
                valid, reason = is_valid_combination(corner_colors)
                
                print(f"Corner colors: {corner_colors} - {'Valid' if valid else 'Invalid: ' + reason}")
                
                if valid:
                    solved = True
                    print(f"Corner {corner['name']} is now valid")
                    break
                
                print(f"Rotating face {face} clockwise")
                face_matrices[face] = rotate_matrix_clockwise(face_matrices[face])
                print_cube_state(face_matrices, f"After rotating {face}")
                
                # Check if previous corners are still valid
                all_previous_valid = True
                for prev_idx in range(corner_idx):
                    prev_corner = corner_definitions[prev_idx]
                    prev_colors = get_corner(face_matrices, prev_corner["indices"])
                    prev_valid, _ = is_valid_combination(prev_colors)
                    
                    if not prev_valid:
                        all_previous_valid = False
                        print(f"Rotation of {face} invalidated previous corner {prev_corner['name']}")
                        break
                
                if not all_previous_valid:
                    print(f"Undoing rotation of {face}")
                    face_matrices[face] = rotate_matrix_counter_clockwise(face_matrices[face])
                    
                rotations += 1
            
            if solved:
                break
        
        if not solved:
            print(f"Could not solve corner {corner['name']} after trying all rotations")
            print("Reverting to original state")
            return False, "Failed to solve corners"
    
    print("\n--- All corners solved, now solving edges ---")
    
    # Now solve the edges
    for edge_idx, edge in enumerate(edge_definitions):
        print(f"\n--- Solving {edge['name']} Edge ---")
        
        max_rotations = 3
        solved = False
        
        for face in edge["rotation_priority"]:
            rotations = 0
            while rotations < max_rotations and not solved:
                edge_colors = get_edge(face_matrices, edge["indices"])
                valid, reason = is_valid_combination(edge_colors)
                
                print(f"Edge colors: {edge_colors} - {'Valid' if valid else 'Invalid: ' + reason}")
                
                if valid:
                    solved = True
                    print(f"Edge {edge['name']} is now valid")
                    break
                
                print(f"Rotating face {face} clockwise")
                face_matrices[face] = rotate_matrix_clockwise(face_matrices[face])
                print_cube_state(face_matrices, f"After rotating {face}")
                
                # Check if corners and previous edges are still valid
                still_valid = True
                
                # Check corners
                for corner in corner_definitions:
                    corner_colors = get_corner(face_matrices, corner["indices"])
                    corner_valid, _ = is_valid_combination(corner_colors)
                    if not corner_valid:
                        still_valid = False
                        print(f"Rotation invalidated corner {corner['name']}")
                        break
                
                # Check previous edges
                if still_valid:
                    for prev_idx in range(edge_idx):
                        prev_edge = edge_definitions[prev_idx]
                        prev_colors = get_edge(face_matrices, prev_edge["indices"])
                        prev_valid, _ = is_valid_combination(prev_colors)
                        
                        if not prev_valid:
                            still_valid = False
                            print(f"Rotation invalidated previous edge {prev_edge['name']}")
                            break
                
                if not still_valid:
                    print(f"Undoing rotation of {face}")
                    face_matrices[face] = rotate_matrix_counter_clockwise(face_matrices[face])
                
                rotations += 1
            
            if solved:
                break
        
        if not solved:
            print(f"Could not solve edge {edge['name']} after trying all rotations")
            print("Reverting to original state")
            return False, "Failed to solve edges"
    
    print("\n--- Checking if yellow side needs adjustments ---")
    
    # Now handle the yellow side
    yellow_rotation_count = 0
    while yellow_rotation_count < 4:  # Try all 4 possible orientations
        is_valid, message = validate_cube(face_matrices, verbose=True)
        
        if is_valid:
            print("Yellow side is valid, cube is solved!")
            break
        
        print("Rotating yellow face clockwise")
        face_matrices['y'] = rotate_matrix_clockwise(face_matrices['y'])
        print_cube_state(face_matrices, "After rotating yellow face")
        
        yellow_rotation_count += 1
    
    if yellow_rotation_count == 4 and not is_valid:
        print("Could not solve yellow side after trying all rotations")
        return False, "Failed to solve yellow side"
    
    # Final validation
    is_valid, message = validate_cube(face_matrices, verbose=True)
    if is_valid:
        print("\n--- CUBE SOLVED SUCCESSFULLY ---")
        return True, face_matrices
    else:
        print("\n--- FAILED TO SOLVE CUBE ---")
        print(f"Reason: {message}")
        return False, message

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

def annotate_cube_visualization(face_matrices):
    """Generate a text visualization of the cube with labels."""
    # Create a template for the visualization
    template = """
                  |--------------|
                  | {w00} | {w01} | {w02} |
                  |--------------|
                  | {w10} | {w11} | {w12} |
                  |--------------|
                  | {w20} | {w21} | {w22} |
                  |--------------|
|--------------|--------------|--------------|--------------|
| {o00} | {o01} | {o02} | {g00} | {g01} | {g02} | {r00} | {r01} | {r02} | {b00} | {b01} | {b02} |
|--------------|--------------|--------------|--------------|
| {o10} | {o11} | {o12} | {g10} | {g11} | {g12} | {r10} | {r11} | {r12} | {b10} | {b11} | {b12} |
|--------------|--------------|--------------|--------------|
| {o20} | {o21} | {o22} | {g20} | {g21} | {g22} | {r20} | {r21} | {r22} | {b20} | {b21} | {b22} |
|--------------|--------------|--------------|--------------|
                  |--------------|
                  | {y00} | {y01} | {y02} |
                  |--------------|
                  | {y10} | {y11} | {y12} |
                  |--------------|
                  | {y20} | {y21} | {y22} |
                  |--------------|
    """
    
    # Create a dictionary to map template placeholders to cube values
    mapping = {}
    for face in face_matrices:
        for i in range(3):
            for j in range(3):
                mapping[f"{face}{i}{j}"] = face_matrices[face][i, j]
    
    # Fill in the template
    return template.format(**mapping)

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
    
    # Visual representation of the cube
    print("Initial cube visualization:")
    print(annotate_cube_visualization(face_matrices))
    
    # Validate the initial state
    is_valid, message = validate_cube(face_matrices, verbose=True)
    print(f"Initial validation: {message}")
    
    if not is_valid:
        # Try to solve
        print("Attempting to solve...")
        solved, result = solve_cube_step_by_step(face_matrices)
        
        if solved:
            face_matrices = result
            print("Solved successfully!")
            # Display the solved state
            print("Solved state:")
            for face in face_matrices:
                print(f"{face} face:")
                print(np.array2string(face_matrices[face], separator=' '))
                print()
            print("Solved cube visualization:")
            print(annotate_cube_visualization(face_matrices))
        else:
            print(f"Failed to solve: {result}")
    
    # Generate the final string
    final_string = matrix_to_string(face_matrices)
    print(f"Final string representation (URFDLB/wrgyob order): {final_string}")

if __name__ == "__main__":
    main()