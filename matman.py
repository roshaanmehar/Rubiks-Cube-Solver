import numpy as np
import copy
from collections import deque, Counter
import random
import time

def strmat(matstring):
    """Converts a string representation of a matrix to a NumPy array."""
    matrix = [list(row.strip()) for row in matstring.strip().split("\n")]
    return np.array(matrix)

class CubeState:
    """Represents the state of a Rubik's cube with efficient operations."""
    
    def __init__(self, face_matrices=None):
        """Initialize a cube state from face matrices or create a solved cube."""
        if face_matrices:
            self.faces = face_matrices
        else:
            # Create a solved cube
            self.faces = {
                'w': np.full((3, 3), 'w'),
                'r': np.full((3, 3), 'r'),
                'g': np.full((3, 3), 'g'),
                'y': np.full((3, 3), 'y'),
                'o': np.full((3, 3), 'o'),
                'b': np.full((3, 3), 'b')
            }
    
    def copy(self):
        """Create a deep copy of the cube state."""
        return CubeState({face: np.copy(matrix) for face, matrix in self.faces.items()})
    
    def to_string(self):
        """Convert the cube to a string representation in URFDLB (wrgyob) order."""
        result = ""
        for face in ['w', 'r', 'g', 'y', 'o', 'b']:
            for i in range(3):
                for j in range(3):
                    result += self.faces[face][i, j]
        return result
    
    def rotate_face(self, face, direction='cw'):
        """
        Rotate a face of the cube and update adjacent faces.
        
        Args:
            face: The face to rotate ('w', 'r', 'g', 'y', 'o', 'b')
            direction: 'cw' for clockwise, 'ccw' for counter-clockwise, '2' for 180 degrees
        """
        # Create a copy of the current state
        new_state = self.copy()
        
        # Rotate the specified face
        if direction == 'cw':
            new_state.faces[face] = np.rot90(self.faces[face], k=3)
        elif direction == 'ccw':
            new_state.faces[face] = np.rot90(self.faces[face], k=1)
        elif direction == '2':
            new_state.faces[face] = np.rot90(self.faces[face], k=2)
        
        # Update adjacent faces based on which face is being rotated
        if face == 'w':  # White (top) face
            # Save values from the top row of each adjacent face
            temp = np.copy(new_state.faces['g'][0, :])
            # Move right column of orange to top row of green (reversed)
            new_state.faces['g'][0, :] = new_state.faces['o'][:, 2][::-1]
            # Move top row of blue to right column of orange
            new_state.faces['o'][:, 2] = new_state.faces['b'][0, :]
            # Move left column of red to top row of blue (reversed)
            new_state.faces['b'][0, :] = new_state.faces['r'][:, 0][::-1]
            # Move saved top row of green to left column of red
            new_state.faces['r'][:, 0] = temp
            
        elif face == 'y':  # Yellow (bottom) face
            # Save values from the bottom row of green
            temp = np.copy(new_state.faces['g'][2, :])
            # Move bottom row of red to bottom row of green
            new_state.faces['g'][2, :] = new_state.faces['r'][2, :]
            # Move bottom row of blue to bottom row of red
            new_state.faces['r'][2, :] = new_state.faces['b'][2, :]
            # Move bottom row of orange to bottom row of blue
            new_state.faces['b'][2, :] = new_state.faces['o'][2, :]
            # Move saved bottom row of green to bottom row of orange
            new_state.faces['o'][2, :] = temp
            
        elif face == 'r':  # Red face
            # Save values from the right column of white
            temp = np.copy(new_state.faces['w'][:, 2])
            # Move right column of green to right column of white
            new_state.faces['w'][:, 2] = new_state.faces['g'][:, 2]
            # Move right column of yellow to right column of green
            new_state.faces['g'][:, 2] = new_state.faces['y'][:, 2]
            # Move left column of blue to right column of yellow (reversed)
            new_state.faces['y'][:, 2] = new_state.faces['b'][:, 0][::-1]
            # Move saved right column of white to left column of blue (reversed)
            new_state.faces['b'][:, 0] = temp[::-1]
            
        elif face == 'o':  # Orange face
            # Save values from the left column of white
            temp = np.copy(new_state.faces['w'][:, 0])
            # Move left column of blue to left column of white (reversed)
            new_state.faces['w'][:, 0] = new_state.faces['b'][:, 2][::-1]
            # Move left column of yellow to left column of blue (reversed)
            new_state.faces['b'][:, 2] = new_state.faces['y'][:, 0][::-1]
            # Move left column of green to left column of yellow
            new_state.faces['y'][:, 0] = new_state.faces['g'][:, 0]
            # Move saved left column of white to left column of green
            new_state.faces['g'][:, 0] = temp
            
        elif face == 'g':  # Green face
            # Save values from the bottom row of white
            temp = np.copy(new_state.faces['w'][2, :])
            # Move left column of red to bottom row of white (reversed)
            new_state.faces['w'][2, :] = new_state.faces['r'][:, 1]
            # Move top row of yellow to left column of red (reversed)
            new_state.faces['r'][:, 1] = new_state.faces['y'][0, :][::-1]
            # Move right column of orange to top row of yellow (reversed)
            new_state.faces['y'][0, :] = new_state.faces['o'][:, 1][::-1]
            # Move saved bottom row of white to right column of orange
            new_state.faces['o'][:, 1] = temp
            
        elif face == 'b':  # Blue face
            # Save values from the top row of white
            temp = np.copy(new_state.faces['w'][0, :])
            # Move right column of orange to top row of white
            new_state.faces['w'][0, :] = new_state.faces['o'][:, 1]
            # Move bottom row of yellow to right column of orange (reversed)
            new_state.faces['o'][:, 1] = new_state.faces['y'][2, :][::-1]
            # Move left column of red to bottom row of yellow
            new_state.faces['y'][2, :] = new_state.faces['r'][:, 1]
            # Move saved top row of white to left column of red (reversed)
            new_state.faces['r'][:, 1] = temp[::-1]
        
        # If direction is counter-clockwise, apply the rotation three times to get the same effect
        if direction == 'ccw':
            new_state = new_state.rotate_face(face, 'cw')
            new_state = new_state.rotate_face(face, 'cw')
        elif direction == '2':
            new_state = new_state.rotate_face(face, 'cw')
            
        return new_state
    
    def get_corner(self, corner_indices):
        """Get the colors at a specific corner across multiple faces."""
        colors = []
        for face, indices in corner_indices:
            i, j = indices
            colors.append(self.faces[face][i, j])
        return colors
    
    def get_edge(self, edge_indices):
        """Get the colors at a specific edge across multiple faces."""
        colors = []
        for face, indices in edge_indices:
            i, j = indices
            colors.append(self.faces[face][i, j])
        return colors
    
    def get_all_corners_and_edges(self):
        """Get all corners and edges of the cube with their current colors."""
        # Define all corner and edge positions
        corners = [
            # Top layer corners
            [('w', (0, 0)), ('o', (0, 2)), ('b', (0, 0))],  # w-o-b
            [('w', (0, 2)), ('r', (0, 0)), ('b', (0, 2))],  # w-r-b
            [('w', (2, 2)), ('g', (0, 2)), ('r', (0, 2))],  # w-g-r
            [('w', (2, 0)), ('o', (0, 0)), ('g', (0, 0))],  # w-o-g
            
            # Bottom layer corners
            [('y', (0, 0)), ('g', (2, 0)), ('o', (2, 2))],  # y-g-o
            [('y', (0, 2)), ('r', (2, 2)), ('g', (2, 2))],  # y-r-g
            [('y', (2, 2)), ('b', (2, 2)), ('r', (2, 0))],  # y-b-r
            [('y', (2, 0)), ('o', (2, 0)), ('b', (2, 0))],  # y-o-b
        ]
        
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
        
        corner_colors = [self.get_corner(corner) for corner in corners]
        edge_colors = [self.get_edge(edge) for edge in edges]
        
        return corners, corner_colors, edges, edge_colors
    
    def is_valid(self, verbose=False):
        """Check if the cube state is valid."""
        # Check if each color appears exactly 9 times
        all_colors = []
        for face in self.faces.values():
            all_colors.extend(face.flatten())
        
        color_counts = Counter(all_colors)
        if not all(count == 9 for count in color_counts.values()):
            if verbose:
                print("Invalid color distribution:", color_counts)
            return False
        
        # Check if center pieces match the expected colors
        centers = {
            'w': self.faces['w'][1, 1],
            'r': self.faces['r'][1, 1],
            'g': self.faces['g'][1, 1],
            'y': self.faces['y'][1, 1],
            'o': self.faces['o'][1, 1],
            'b': self.faces['b'][1, 1]
        }
        
        if not all(centers[face] == face for face in centers):
            if verbose:
                print("Invalid center pieces:", centers)
            return False
        
        # Check corners and edges
        _, corner_colors, _, edge_colors = self.get_all_corners_and_edges()
        
        # Check for invalid corners
        for i, colors in enumerate(corner_colors):
            if not is_valid_combination(colors):
                if verbose:
                    print(f"Invalid corner {i+1}: {colors}")
                return False
        
        # Check for invalid edges
        for i, colors in enumerate(edge_colors):
            if not is_valid_combination(colors):
                if verbose:
                    print(f"Invalid edge {i+1}: {colors}")
                return False
        
        return True
    
    def is_solved(self):
        """Check if the cube is solved (each face has a single color)."""
        for face, matrix in self.faces.items():
            if not np.all(matrix == face):
                return False
        return True
    
    def apply_move_sequence(self, moves):
        """Apply a sequence of moves to the cube."""
        state = self
        for face, direction in moves:
            state = state.rotate_face(face, direction)
        return state
    
    def scramble(self, num_moves=20):
        """Scramble the cube with random moves."""
        faces = ['w', 'r', 'g', 'y', 'o', 'b']
        directions = ['cw', 'ccw', '2']
        
        state = self
        moves = []
        
        for _ in range(num_moves):
            face = random.choice(faces)
            direction = random.choice(directions)
            state = state.rotate_face(face, direction)
            moves.append((face, direction))
        
        return state, moves

def is_valid_combination(colors):
    """Check if a combination of colors is valid (no opposites or duplicates)."""
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

def kociemba_phase1(cube_state, max_depth=10, timeout=30):
    """
    First phase of Kociemba's algorithm: Orient edges and corners.
    
    This is a simplified version that focuses on fixing invalid corners and edges.
    """
    print("Starting Kociemba Phase 1...")
    
    # Define possible moves
    faces = ['w', 'r', 'g', 'y', 'o', 'b']
    directions = ['cw', 'ccw', '2']
    
    # Initialize queue with the initial state
    start_time = time.time()
    queue = deque([(cube_state, [])])  # (state, moves)
    visited = set()
    
    # Convert state to a hashable format for visited set
    def state_to_string(state):
        return state.to_string()
    
    # Add initial state to visited
    visited.add(state_to_string(cube_state))
    
    # Define a heuristic function to guide the search
    def heuristic(state):
        _, corner_colors, _, edge_colors = state.get_all_corners_and_edges()
        invalid_count = 0
        
        for colors in corner_colors:
            if not is_valid_combination(colors):
                invalid_count += 1
        
        for colors in edge_colors:
            if not is_valid_combination(colors):
                invalid_count += 1
        
        return invalid_count
    
    # Initial heuristic value
    initial_h = heuristic(cube_state)
    print(f"Initial invalid pieces: {initial_h}")
    
    # Track best state found so far
    best_state = cube_state
    best_moves = []
    best_h = initial_h
    
    while queue and time.time() - start_time < timeout:
        state, moves = queue.popleft()
        
        # Check if we've reached the maximum depth
        if len(moves) >= max_depth:
            continue
        
        # Calculate heuristic for current state
        h = heuristic(state)
        
        # Update best state if this one is better
        if h < best_h:
            best_h = h
            best_state = state
            best_moves = moves
            print(f"Found better state with {h} invalid pieces after {len(moves)} moves")
            
            # If all pieces are valid, we're done with Phase 1
            if h == 0:
                print(f"Phase 1 complete! All pieces are valid after {len(moves)} moves")
                return state, moves
        
        # Try all possible moves
        for face in faces:
            for direction in directions:
                # Apply move
                new_state = state.rotate_face(face, direction)
                
                # Generate a hashable representation of the new state
                state_str = state_to_string(new_state)
                
                # Skip if we've seen this state before
                if state_str in visited:
                    continue
                
                # Add to queue and visited
                visited.add(state_str)
                queue.append((new_state, moves + [(face, direction)]))
        
        # Print progress occasionally
        if len(visited) % 1000 == 0:
            elapsed = time.time() - start_time
            print(f"Searched {len(visited)} states in {elapsed:.2f}s, current depth: {len(moves)}")
    
    print(f"Phase 1 search ended. Best state has {best_h} invalid pieces after {len(best_moves)} moves")
    return best_state, best_moves

def kociemba_phase2(cube_state, max_depth=10, timeout=30):
    """
    Second phase of Kociemba's algorithm: Solve the cube while preserving orientation.
    
    This is a simplified version that tries to solve the cube completely.
    """
    print("Starting Kociemba Phase 2...")
    
    # Define possible moves
    # In true Kociemba Phase 2, only certain moves are allowed to preserve orientation
    # For simplicity, we'll allow all moves but prioritize those that maintain valid pieces
    faces = ['w', 'r', 'g', 'y', 'o', 'b']
    directions = ['cw', 'ccw', '2']
    
    # Initialize queue with the initial state
    start_time = time.time()
    queue = deque([(cube_state, [])])  # (state, moves)
    visited = set()
    
    # Convert state to a hashable format for visited set
    def state_to_string(state):
        return state.to_string()
    
    # Add initial state to visited
    visited.add(state_to_string(cube_state))
    
    # Define a heuristic function to guide the search
    def heuristic(state):
        # Count how many stickers are in their correct position
        correct_count = 0
        for face, matrix in state.faces.items():
            correct_count += np.sum(matrix == face)
        
        # Return the inverse (lower is better)
        return 54 - correct_count
    
    # Initial heuristic value
    initial_h = heuristic(cube_state)
    print(f"Initial incorrect stickers: {initial_h}")
    
    # Track best state found so far
    best_state = cube_state
    best_moves = []
    best_h = initial_h
    
    while queue and time.time() - start_time < timeout:
        state, moves = queue.popleft()
        
        # Check if we've reached the maximum depth
        if len(moves) >= max_depth:
            continue
        
        # Calculate heuristic for current state
        h = heuristic(state)
        
        # Update best state if this one is better
        if h < best_h:
            best_h = h
            best_state = state
            best_moves = moves
            print(f"Found better state with {h} incorrect stickers after {len(moves)} moves")
            
            # If the cube is solved, we're done
            if h == 0:
                print(f"Cube solved after {len(moves)} moves!")
                return state, moves
        
        # Try all possible moves
        for face in faces:
            for direction in directions:
                # Apply move
                new_state = state.rotate_face(face, direction)
                
                # Skip if the move creates invalid pieces
                _, corner_colors, _, edge_colors = new_state.get_all_corners_and_edges()
                invalid = False
                
                for colors in corner_colors + edge_colors:
                    if not is_valid_combination(colors):
                        invalid = True
                        break
                
                if invalid:
                    continue
                
                # Generate a hashable representation of the new state
                state_str = state_to_string(new_state)
                
                # Skip if we've seen this state before
                if state_str in visited:
                    continue
                
                # Add to queue and visited
                visited.add(state_str)
                queue.append((new_state, moves + [(face, direction)]))
        
        # Print progress occasionally
        if len(visited) % 1000 == 0:
            elapsed = time.time() - start_time
            print(f"Searched {len(visited)} states in {elapsed:.2f}s, current depth: {len(moves)}")
    
    print(f"Phase 2 search ended. Best state has {best_h} incorrect stickers after {len(best_moves)} moves")
    return best_state, best_moves

def solve_cube(cube_state, phase1_depth=8, phase2_depth=12, timeout=30):
    """Solve the cube using Kociemba's two-phase algorithm."""
    print("Starting cube solving process...")
    
    # Phase 1: Orient edges and corners
    phase1_state, phase1_moves = kociemba_phase1(cube_state, max_depth=phase1_depth, timeout=timeout)
    
    # Phase 2: Solve the cube while preserving orientation
    phase2_state, phase2_moves = kociemba_phase2(phase1_state, max_depth=phase2_depth, timeout=timeout)
    
    # Combine the moves from both phases
    all_moves = phase1_moves + phase2_moves
    final_state = cube_state.apply_move_sequence(all_moves)
    
    return final_state, all_moves

def print_move_sequence(moves):
    """Print a sequence of moves in a readable format."""
    if not moves:
        print("No moves to display")
        return
    
    print("\nSolution sequence:")
    for i, (face, direction) in enumerate(moves):
        dir_symbol = {
            'cw': '',
            'ccw': "'",
            '2': '2'
        }[direction]
        print(f"{i+1}. {face.upper()}{dir_symbol}", end=" ")
        if (i + 1) % 10 == 0:
            print()  # New line every 10 moves
    print("\n")

def visualize_cube(cube_state):
    """Generate a text visualization of the cube."""
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
    for face in cube_state.faces:
        for i in range(3):
            for j in range(3):
                mapping[f"{face}{i}{j}"] = cube_state.faces[face][i, j]
    
    # Fill in the template
    return template.format(**mapping)

def main():
    # Parse the input matrices
    red_mat = strmat("""bbb
                     rrr
                     rrr""")

    blue_mat = strmat("""ooo
                      bbb
                      bbb""")

    orange_mat = strmat("""ggg
                        ooo
                        ooo""")

    white_mat = strmat("""www
                       www
                       www""")

    yellow_mat = strmat("""yyy
                        yyy
                        yyy""")

    green_mat = strmat("""rrr
                       ggg
                       ggg""")
    
    # Create a dictionary of face matrices
    face_matrices = {
        'w': white_mat,
        'r': red_mat,
        'g': green_mat,
        'y': yellow_mat,
        'o': orange_mat,
        'b': blue_mat
    }
    
    # Create a cube state from the matrices
    cube = CubeState(face_matrices)
    
    # Display the initial state
    print("Initial cube state:")
    print(visualize_cube(cube))
    
    # Validate the cube
    _, corner_colors, _, edge_colors = cube.get_all_corners_and_edges()
    
    # Check for invalid corners
    invalid_corners = []
    for i, colors in enumerate(corner_colors):
        if not is_valid_combination(colors):
            invalid_corners.append((i+1, colors))
    
    # Check for invalid edges
    invalid_edges = []
    for i, colors in enumerate(edge_colors):
        if not is_valid_combination(colors):
            invalid_edges.append((i+1, colors))
    
    # Print validation results
    if invalid_corners:
        print("Invalid corners:")
        for i, colors in invalid_corners:
            print(f"Corner {i}: {colors}")
    
    if invalid_edges:
        print("Invalid edges:")
        for i, colors in invalid_edges:
            print(f"Edge {i}: {colors}")
    
    if invalid_corners or invalid_edges:
        print("Warning: The cube configuration appears to be invalid.")
        print("Attempting to solve anyway...")
    
    # Try to solve the cube
    solved_cube, solution_moves = solve_cube(cube, phase1_depth=8, phase2_depth=12, timeout=60)
    
    # Print the solution
    if solution_moves:
        print_move_sequence(solution_moves)
        print(f"Solution found with {len(solution_moves)} moves!")
    else:
        print("Could not find a complete solution.")
    
    # Check if the solution is valid
    if solved_cube.is_solved():
        print("The solution successfully solves the cube!")
    else:
        print("The solution does not completely solve the cube.")
        print("Final cube state:")
        print(visualize_cube(solved_cube))
    
    # Generate the final string
    final_string = solved_cube.to_string()
    print(f"Final string representation (URFDLB/wrgyob order): {final_string}")

if __name__ == "__main__":
    main()