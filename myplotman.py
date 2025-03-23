import numpy as np
import tkinter as tk
from tkinter import Canvas, Frame, Label, Button
import time
from collections import Counter

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
        
        # Define the opposite colors
        self.opposites = {
            'w': 'y', 'y': 'w',
            'r': 'o', 'o': 'r',
            'g': 'b', 'b': 'g'
        }
        
        # Define color mapping for visualization
        self.color_map = {
            'w': 'white',
            'y': 'yellow',
            'r': 'red',
            'o': 'orange',
            'g': 'green',
            'b': 'blue'
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
            # Save values from the top row of green
            temp = np.copy(self.faces['g'][0, :])
            # Move right column of orange to top row of green (reversed)
            new_state.faces['g'][0, :] = self.faces['o'][:, 2][::-1]
            # Move top row of blue to right column of orange
            new_state.faces['o'][:, 2] = self.faces['b'][0, :]
            # Move left column of red to top row of blue (reversed)
            new_state.faces['b'][0, :] = self.faces['r'][:, 0][::-1]
            # Move saved top row of green to left column of red
            new_state.faces['r'][:, 0] = temp
            
        elif face == 'y':  # Yellow (bottom) face
            # Save values from the bottom row of green
            temp = np.copy(self.faces['g'][2, :])
            # Move bottom row of red to bottom row of green
            new_state.faces['g'][2, :] = self.faces['r'][2, :]
            # Move bottom row of blue to bottom row of red
            new_state.faces['r'][2, :] = self.faces['b'][2, :]
            # Move bottom row of orange to bottom row of blue
            new_state.faces['b'][2, :] = self.faces['o'][2, :]
            # Move saved bottom row of green to bottom row of orange
            new_state.faces['o'][2, :] = temp
            
        elif face == 'r':  # Red face
            # Save values from the right column of white
            temp = np.copy(self.faces['w'][:, 2])
            # Move right column of green to right column of white
            new_state.faces['w'][:, 2] = self.faces['g'][:, 2]
            # Move right column of yellow to right column of green
            new_state.faces['g'][:, 2] = self.faces['y'][:, 2]
            # Move left column of blue to right column of yellow (reversed)
            new_state.faces['y'][:, 2] = self.faces['b'][:, 0][::-1]
            # Move saved right column of white to left column of blue (reversed)
            new_state.faces['b'][:, 0] = temp[::-1]
            
        elif face == 'o':  # Orange face
            # Save values from the left column of white
            temp = np.copy(self.faces['w'][:, 0])
            # Move left column of blue to left column of white (reversed)
            new_state.faces['w'][:, 0] = self.faces['b'][:, 2][::-1]
            # Move left column of yellow to left column of blue (reversed)
            new_state.faces['b'][:, 2] = self.faces['y'][:, 0][::-1]
            # Move left column of green to left column of yellow
            new_state.faces['y'][:, 0] = self.faces['g'][:, 0]
            # Move saved left column of white to left column of green
            new_state.faces['g'][:, 0] = temp
            
        elif face == 'g':  # Green face
            # Save values from the bottom row of white
            temp = np.copy(self.faces['w'][2, :])
            # Move left column of red to bottom row of white
            new_state.faces['w'][2, :] = self.faces['r'][:, 1]
            # Move top row of yellow to left column of red (reversed)
            new_state.faces['r'][:, 1] = self.faces['y'][0, :][::-1]
            # Move right column of orange to top row of yellow (reversed)
            new_state.faces['y'][0, :] = self.faces['o'][:, 1][::-1]
            # Move saved bottom row of white to right column of orange
            new_state.faces['o'][:, 1] = temp
            
        elif face == 'b':  # Blue face
            # Save values from the top row of white
            temp = np.copy(self.faces['w'][0, :])
            # Move right column of orange to top row of white
            new_state.faces['w'][0, :] = self.faces['o'][:, 1]
            # Move bottom row of yellow to right column of orange (reversed)
            new_state.faces['o'][:, 1] = self.faces['y'][2, :][::-1]
            # Move left column of red to bottom row of yellow
            new_state.faces['y'][2, :] = self.faces['r'][:, 1]
            # Move saved top row of white to left column of red (reversed)
            new_state.faces['r'][:, 1] = temp[::-1]
        
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
    
    def is_valid_combination(self, colors):
        """Check if a combination of colors is valid (no opposites or duplicates)."""
        # Check for duplicates
        color_counts = Counter(colors)
        for color, count in color_counts.items():
            if count > 1:
                return False, f"Contains duplicate color: {color} appears {count} times"
        
        # Check for opposites
        for i in range(len(colors)):
            for j in range(i + 1, len(colors)):
                if self.opposites.get(colors[i]) == colors[j]:
                    return False, f"Contains opposite colors {colors[i]} and {colors[j]}"
        
        return True, "Valid"

class CubeVisualizer:
    """A Tkinter-based visualizer for the Rubik's Cube."""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Rubik's Cube Solver")
        self.root.geometry("800x600")
        
        # Set up the main frame
        self.main_frame = Frame(root)
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Set up the canvas for drawing the cube
        self.canvas = Canvas(self.main_frame, bg="light gray")
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Set up the status label
        self.status_label = Label(self.main_frame, text="Initializing...", font=("Arial", 12))
        self.status_label.pack(pady=5)
        
        # Set up the move label
        self.move_label = Label(self.main_frame, text="", font=("Arial", 12))
        self.move_label.pack(pady=5)
        
        # Set up the control buttons
        self.button_frame = Frame(self.main_frame)
        self.button_frame.pack(pady=10)
        
        self.start_button = Button(self.button_frame, text="Start Solving", command=self.start_solving)
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        self.step_button = Button(self.button_frame, text="Step", command=self.step_solve, state=tk.DISABLED)
        self.step_button.pack(side=tk.LEFT, padx=5)
        
        self.reset_button = Button(self.button_frame, text="Reset", command=self.reset)
        self.reset_button.pack(side=tk.LEFT, padx=5)
        
        # Set up the cube state
        self.cube = None
        self.solver = None
        self.solving_in_progress = False
        self.step_mode = False
        
        # Set up the color mapping
        self.color_map = {
            'w': 'white',
            'y': 'yellow',
            'r': 'red',
            'o': 'orange',
            'g': 'green',
            'b': 'blue'
        }
        
        # Set up the positions for each face in the net layout
        self.positions = {
            'w': (3, 0),  # White on top
            'o': (0, 3),  # Orange on left
            'g': (3, 3),  # Green in front
            'r': (6, 3),  # Red on right
            'b': (9, 3),  # Blue on back
            'y': (3, 6)   # Yellow on bottom
        }
        
        # Set up the cell size for drawing
        self.cell_size = 40
        
        # Initialize the cube
        self.initialize_cube()
    
    def initialize_cube(self):
        """Initialize the cube with the given matrices."""
        # Parse the input matrices
        red_mat = strmat("""wwo
                         bry
                         bgw""")

        blue_mat = strmat("""bgw
                          ybw
                          ggy""")

        orange_mat = strmat("""owg
                            yob
                            ygy""")

        white_mat = strmat("""brg
                           owo
                           owr""")

        yellow_mat = strmat("""wbr
                            ryb
                            rro""")

        green_mat = strmat("""yog
                           rgo
                           ryb""")
        
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
        self.cube = CubeState(face_matrices)
        
        # Draw the initial cube state
        self.draw_cube()
        self.status_label.config(text="Cube initialized. Press 'Start Solving' to begin.")
    
    def draw_cube(self):
        """Draw the current cube state on the canvas."""
        # Clear the canvas
        self.canvas.delete("all")
        
        # Draw each face
        for face, pos in self.positions.items():
            x_offset, y_offset = pos
            x_offset *= self.cell_size
            y_offset *= self.cell_size
            
            # Draw the face label
            self.canvas.create_text(
                x_offset + 1.5 * self.cell_size, 
                y_offset - 20, 
                text=face.upper(), 
                font=("Arial", 14, "bold")
            )
            
            # Draw each cell of the face
            for i in range(3):
                for j in range(3):
                    color = self.color_map[self.cube.faces[face][i, j]]
                    
                    self.canvas.create_rectangle(
                        x_offset + j * self.cell_size,
                        y_offset + i * self.cell_size,
                        x_offset + (j + 1) * self.cell_size,
                        y_offset + (i + 1) * self.cell_size,
                        fill=color,
                        outline="black",
                        width=2
                    )
                    
                    # Add the color letter in the center of each cell
                    self.canvas.create_text(
                        x_offset + (j + 0.5) * self.cell_size,
                        y_offset + (i + 0.5) * self.cell_size,
                        text=self.cube.faces[face][i, j],
                        font=("Arial", 10, "bold"),
                        fill="black"
                    )
        
        # Update the canvas
        self.canvas.update()
    
    def start_solving(self):
        """Start the solving process."""
        if not self.solving_in_progress:
            self.solving_in_progress = True
            self.start_button.config(state=tk.DISABLED)
            self.step_button.config(state=tk.NORMAL)
            self.status_label.config(text="Solving in progress...")
            
            # Create a solver generator
            self.solver = self.layer_by_layer_solver_generator(self.cube)
            
            # Start the solving process
            if not self.step_mode:
                self.root.after(100, self.continue_solving)
    
    def continue_solving(self):
        """Continue the solving process."""
        if self.solving_in_progress:
            try:
                # Get the next step from the solver
                status, move, cube = next(self.solver)
                
                # Update the cube state
                self.cube = cube
                
                # Update the display
                self.draw_cube()
                self.status_label.config(text=status)
                
                if move:
                    face, direction = move
                    dir_text = {'cw': 'clockwise', 'ccw': 'counter-clockwise', '2': 'twice'}[direction]
                    self.move_label.config(text=f"Move: Rotate {face.upper()} face {dir_text}")
                else:
                    self.move_label.config(text="")
                
                # Schedule the next step with a 3-second delay
                self.root.after(3000, self.continue_solving)  # 3000ms = 3 seconds
            
            except StopIteration:
                # Solving is complete
                self.solving_in_progress = False
                self.status_label.config(text="Solving complete!")
                self.move_label.config(text="")
                self.start_button.config(state=tk.DISABLED)
                self.step_button.config(state=tk.DISABLED)
    
    def step_solve(self):
        """Perform a single step of the solving process."""
        if self.solving_in_progress:
            try:
                # Get the next step from the solver
                status, move, cube = next(self.solver)
                
                # Update the cube state
                self.cube = cube
                
                # Update the display
                self.draw_cube()
                self.status_label.config(text=status)
                
                if move:
                    face, direction = move
                    dir_text = {'cw': 'clockwise', 'ccw': 'counter-clockwise', '2': 'twice'}[direction]
                    self.move_label.config(text=f"Move: Rotate {face.upper()} face {dir_text}")
                else:
                    self.move_label.config(text="")
            
            except StopIteration:
                # Solving is complete
                self.solving_in_progress = False
                self.status_label.config(text="Solving complete!")
                self.move_label.config(text="")
                self.start_button.config(state=tk.DISABLED)
                self.step_button.config(state=tk.DISABLED)
    
    def reset(self):
        """Reset the cube to its initial state."""
        self.solving_in_progress = False
        self.solver = None
        self.start_button.config(state=tk.NORMAL)
        self.step_button.config(state=tk.DISABLED)
        self.status_label.config(text="Cube reset. Press 'Start Solving' to begin.")
        self.move_label.config(text="")
        
        # Re-initialize the cube
        self.initialize_cube()
    
    def layer_by_layer_solver_generator(self, cube):
        """
        Generator function that yields each step of the layer-by-layer solving process.
        
        Args:
            cube: The CubeState object representing the cube
        
        Yields:
            status: A string describing the current status
            move: The move being applied (face, direction) or None
            cube: The updated cube state
        """
        # Define the corners and edges we'll work with
        corners = [
            # White-face corners (clockwise from top-left)
            [('w', (0, 0)), ('o', (0, 2)), ('b', (0, 0))],  # White-Orange-Blue (WOB)
            [('w', (0, 2)), ('r', (0, 0)), ('b', (0, 2))],  # White-Red-Blue (WRB)
            [('w', (2, 2)), ('r', (0, 2)), ('g', (0, 2))],  # White-Red-Green (WRG)
            [('w', (2, 0)), ('o', (0, 0)), ('g', (0, 0))],  # White-Orange-Green (WOG)
        ]
        
        edges = [
            # White-face edges (clockwise from top)
            [('w', (0, 1)), ('b', (0, 1))],  # White-Blue (WB)
            [('w', (1, 2)), ('r', (0, 1))],  # White-Red (WR)
            [('w', (2, 1)), ('g', (0, 1))],  # White-Green (WG)
            [('w', (1, 0)), ('o', (0, 1))],  # White-Orange (WO)
        ]
        
        # Store the moves we apply
        moves = []
        
        # Initial status
        yield "Initial cube state", None, cube
        
        # Step 1: Fix the white corners one by one
        for i, corner in enumerate(corners):
            corner_name = ["White-Orange-Blue", "White-Red-Blue", "White-Red-Green", "White-Orange-Green"][i]
            yield f"Step 1: Working on corner {i+1}: {corner_name}", None, cube
            
            # Get the current colors at this corner
            colors = cube.get_corner(corner)
            valid, reason = cube.is_valid_combination(colors)
            
            if not valid:
                yield f"Corner {i+1} is invalid: {reason}", None, cube
                
                # Try rotating adjacent faces to fix this corner
                adjacent_faces = [face for face, _ in corner if face != 'w']
                fixed = False
                
                for face in adjacent_faces:
                    for direction in ['cw', 'ccw', '2']:
                        # Try rotating this face
                        new_cube = cube.rotate_face(face, direction)
                        new_colors = new_cube.get_corner(corner)
                        new_valid, _ = new_cube.is_valid_combination(new_colors)
                        
                        if new_valid:
                            yield f"Fixing corner {i+1} by rotating {face} face", (face, direction), new_cube
                            
                            cube = new_cube
                            moves.append((face, direction))
                            fixed = True
                            break
                    
                    if fixed:
                        break
                
                # If no adjacent face rotation worked, try rotating white face
                if not fixed:
                    for direction in ['cw', 'ccw', '2']:
                        new_cube = cube.rotate_face('w', direction)
                        
                        # Check if this improves the situation for any corner
                        improvement = False
                        for j, c in enumerate(corners):
                            old_colors = cube.get_corner(c)
                            old_valid, _ = cube.is_valid_combination(old_colors)
                            
                            new_colors = new_cube.get_corner(c)
                            new_valid, _ = new_cube.is_valid_combination(new_colors)
                            
                            if not old_valid and new_valid:
                                improvement = True
                                break
                        
                        if improvement:
                            yield f"Rotating white face to improve corner situation", ('w', direction), new_cube
                            
                            cube = new_cube
                            moves.append(('w', direction))
                            
                            # After rotating white, we need to restart the corner checking
                            i = -1  # Will be incremented to 0 in the next iteration
                            break
        
        # Step 2: Fix the white edges one by one
        for i, edge in enumerate(edges):
            edge_name = ["White-Blue", "White-Red", "White-Green", "White-Orange"][i]
            yield f"Step 2: Working on edge {i+1}: {edge_name}", None, cube
            
            # Get the current colors at this edge
            colors = cube.get_edge(edge)
            valid, reason = cube.is_valid_combination(colors)
            
            if not valid:
                yield f"Edge {i+1} is invalid: {reason}", None, cube
                
                # Try rotating adjacent faces to fix this edge
                adjacent_faces = [face for face, _ in edge if face != 'w']
                fixed = False
                
                for face in adjacent_faces:
                    for direction in ['cw', 'ccw', '2']:
                        # Try rotating this face
                        new_cube = cube.rotate_face(face, direction)
                        
                        # Check if this fixes the current edge without breaking previous corners
                        new_edge_colors = new_cube.get_edge(edge)
                        new_edge_valid, _ = new_cube.is_valid_combination(new_edge_colors)
                        
                        # Check if corners are still valid
                        corners_still_valid = True
                        for j in range(i):  # Check only corners we've already fixed
                            corner_colors = new_cube.get_corner(corners[j])
                            corner_valid, _ = new_cube.is_valid_combination(corner_colors)
                            if not corner_valid:
                                corners_still_valid = False
                                break
                        
                        if new_edge_valid and corners_still_valid:
                            yield f"Fixing edge {i+1} by rotating {face} face", (face, direction), new_cube
                            
                            cube = new_cube
                            moves.append((face, direction))
                            fixed = True
                            break
                    
                    if fixed:
                        break
                
                # If no adjacent face rotation worked, try rotating white face
                if not fixed:
                    for direction in ['cw', 'ccw', '2']:
                        new_cube = cube.rotate_face('w', direction)
                        
                        # Check if this improves the situation for any edge
                        improvement = False
                        for j, e in enumerate(edges):
                            old_colors = cube.get_edge(e)
                            old_valid, _ = cube.is_valid_combination(old_colors)
                            
                            new_colors = new_cube.get_edge(e)
                            new_valid, _ = new_cube.is_valid_combination(new_colors)
                            
                            if not old_valid and new_valid:
                                improvement = True
                                break
                        
                        if improvement:
                            yield f"Rotating white face to improve edge situation", ('w', direction), new_cube
                            
                            cube = new_cube
                            moves.append(('w', direction))
                            
                            # After rotating white, we need to restart the edge checking
                            i = -1  # Will be incremented to 0 in the next iteration
                            break
        
        # Step 3: Fix the middle layer edges
        middle_edges = [
            # Middle layer edges
            [('b', (1, 2)), ('r', (1, 0))],  # Blue-Red (BR)
            [('r', (1, 2)), ('g', (1, 2))],  # Red-Green (RG)
            [('g', (1, 0)), ('o', (1, 2))],  # Green-Orange (GO)
            [('o', (1, 0)), ('b', (1, 0))],  # Orange-Blue (OB)
        ]
        
        for i, edge in enumerate(middle_edges):
            edge_name = ["Blue-Red", "Red-Green", "Green-Orange", "Orange-Blue"][i]
            yield f"Step 3: Working on middle edge {i+1}: {edge_name}", None, cube
            
            # Get the current colors at this edge
            colors = cube.get_edge(edge)
            valid, reason = cube.is_valid_combination(colors)
            
            if not valid:
                yield f"Middle edge {i+1} is invalid: {reason}", None, cube
                
                # Try rotating adjacent faces to fix this edge
                adjacent_faces = [face for face, _ in edge]
                fixed = False
                
                for face in adjacent_faces:
                    for direction in ['cw', 'ccw', '2']:
                        # Try rotating this face
                        new_cube = cube.rotate_face(face, direction)
                        
                        # Check if this fixes the current edge without breaking previous pieces
                        new_edge_colors = new_cube.get_edge(edge)
                        new_edge_valid, _ = new_cube.is_valid_combination(new_edge_colors)
                        
                        # Check if white corners and edges are still valid
                        pieces_still_valid = True
                        
                        # Check white corners
                        for corner in corners:
                            corner_colors = new_cube.get_corner(corner)
                            corner_valid, _ = new_cube.is_valid_combination(corner_colors)
                            if not corner_valid:
                                pieces_still_valid = False
                                break
                        
                        # Check white edges
                        if pieces_still_valid:
                            for edge in edges:
                                edge_colors = new_cube.get_edge(edge)
                                edge_valid, _ = new_cube.is_valid_combination(edge_colors)
                                if not edge_valid:
                                    pieces_still_valid = False
                                    break
                        
                        # Check previous middle edges
                        if pieces_still_valid:
                            for j in range(i):
                                prev_edge_colors = new_cube.get_edge(middle_edges[j])
                                prev_edge_valid, _ = new_cube.is_valid_combination(prev_edge_colors)
                                if not prev_edge_valid:
                                    pieces_still_valid = False
                                    break
                        
                        if new_edge_valid and pieces_still_valid:
                            yield f"Fixing middle edge {i+1} by rotating {face} face", (face, direction), new_cube
                            
                            cube = new_cube
                            moves.append((face, direction))
                            fixed = True
                            break
                    
                    if fixed:
                        break
        
        # Step 4: Fix the yellow corners and edges
        yellow_corners = [
            # Yellow-face corners (clockwise from top-left)
            [('y', (0, 0)), ('g', (2, 0)), ('o', (2, 2))],  # Yellow-Green-Orange (YGO)
            [('y', (0, 2)), ('r', (2, 2)), ('g', (2, 2))],  # Yellow-Red-Green (YRG)
            [('y', (2, 2)), ('b', (2, 2)), ('r', (2, 0))],  # Yellow-Blue-Red (YBR)
            [('y', (2, 0)), ('o', (2, 0)), ('b', (2, 0))],  # Yellow-Orange-Blue (YOB)
        ]
        
        yellow_edges = [
            # Yellow-face edges (clockwise from top)
            [('y', (0, 1)), ('g', (2, 1))],  # Yellow-Green (YG)
            [('y', (1, 2)), ('r', (2, 1))],  # Yellow-Red (YR)
            [('y', (2, 1)), ('b', (2, 1))],  # Yellow-Blue (YB)
            [('y', (1, 0)), ('o', (2, 1))],  # Yellow-Orange (YO)
        ]
        
        # First fix yellow corners
        for i, corner in enumerate(yellow_corners):
            corner_name = ["Yellow-Green-Orange", "Yellow-Red-Green", "Yellow-Blue-Red", "Yellow-Orange-Blue"][i]
            yield f"Step 4: Working on yellow corner {i+1}: {corner_name}", None, cube
            
            # Get the current colors at this corner
            colors = cube.get_corner(corner)
            valid, reason = cube.is_valid_combination(colors)
            
            if not valid:
                yield f"Yellow corner {i+1} is invalid: {reason}", None, cube
                
                # For yellow corners, we primarily rotate the yellow face
                fixed = False
                
                for direction in ['cw', 'ccw', '2']:
                    # Try rotating yellow face
                    new_cube = cube.rotate_face('y', direction)
                    
                    # Check if this improves the situation
                    improvement = False
                    for j, c in enumerate(yellow_corners):
                        old_colors = cube.get_corner(c)
                        old_valid, _ = cube.is_valid_combination(old_colors)
                        
                        new_colors = new_cube.get_corner(c)
                        new_valid, _ = new_cube.is_valid_combination(new_colors)
                        
                        if not old_valid and new_valid:
                            improvement = True
                            break
                    
                    if improvement:
                        yield f"Rotating yellow face to improve corner situation", ('y', direction), new_cube
                        
                        cube = new_cube
                        moves.append(('y', direction))
                        fixed = True
                        break
                
                # If rotating yellow face didn't work, try adjacent faces
                if not fixed:
                    adjacent_faces = [face for face, _ in corner if face != 'y']
                    
                    for face in adjacent_faces:
                        for direction in ['cw', 'ccw', '2']:
                            # Try rotating this face
                            new_cube = cube.rotate_face(face, direction)
                            
                            # Check if this fixes the current corner without breaking previous pieces
                            new_corner_colors = new_cube.get_corner(corner)
                            new_corner_valid, _ = new_cube.is_valid_combination(new_corner_colors)
                            
                            # Check if white and middle pieces are still valid
                            pieces_still_valid = True
                            
                            # Check white corners
                            for c in corners:
                                c_colors = new_cube.get_corner(c)
                                c_valid, _ = new_cube.is_valid_combination(c_colors)
                                if not c_valid:
                                    pieces_still_valid = False
                                    break
                            
                            # Check white edges
                            if pieces_still_valid:
                                for e in edges:
                                    e_colors = new_cube.get_edge(e)
                                    e_valid, _ = new_cube.is_valid_combination(e_colors)
                                    if not e_valid:
                                        pieces_still_valid = False
                                        break
                            
                            # Check middle edges
                            if pieces_still_valid:
                                for e in middle_edges:
                                    e_colors = new_cube.get_edge(e)
                                    e_valid, _ = new_cube.is_valid_combination(e_colors)
                                    if not e_valid:
                                        pieces_still_valid = False
                                        break
                            
                            if new_corner_valid and pieces_still_valid:
                                yield f"Fixing yellow corner {i+1} by rotating {face} face", (face, direction), new_cube
                                
                                cube = new_cube
                                moves.append((face, direction))
                                fixed = True
                                break
                        
                        if fixed:
                            break
        
        # Then fix yellow edges
        for i, edge in enumerate(yellow_edges):
            edge_name = ["Yellow-Green", "Yellow-Red", "Yellow-Blue", "Yellow-Orange"][i]
            yield f"Step 4: Working on yellow edge {i+1}: {edge_name}", None, cube
            
            # Get the current colors at this edge
            colors = cube.get_edge(edge)
            valid, reason = cube.is_valid_combination(colors)
            
            if not valid:
                yield f"Yellow edge {i+1} is invalid: {reason}", None, cube
                
                # For yellow edges, we primarily rotate the yellow face
                fixed = False
                
                for direction in ['cw', 'ccw', '2']:
                    # Try rotating yellow face
                    new_cube = cube.rotate_face('y', direction)
                    
                    # Check if this improves the situation
                    improvement = False
                    for j, e in enumerate(yellow_edges):
                        old_colors = cube.get_edge(e)
                        old_valid, _ = cube.is_valid_combination(old_colors)
                        
                        new_colors = new_cube.get_edge(e)
                        new_valid, _ = new_cube.is_valid_combination(new_colors)
                        
                        if not old_valid and new_valid:
                            improvement = True
                            break
                    
                    if improvement:
                        yield f"Rotating yellow face to improve edge situation", ('y', direction), new_cube
                        
                        cube = new_cube
                        moves.append(('y', direction))
                        fixed = True
                        break
        
        # Final check to make sure all pieces are valid
        all_valid = True
        
        # Check all corners
        for i, corner in enumerate(corners + yellow_corners):
            colors = cube.get_corner(corner)
            valid, reason = cube.is_valid_combination(colors)
            if not valid:
                all_valid = False
                yield f"Corner {i+1} is still invalid: {reason}", None, cube
        
        # Check all edges
        for i, edge in enumerate(edges + middle_edges + yellow_edges):
            colors = cube.get_edge(edge)
            valid, reason = cube.is_valid_combination(colors)
            if not valid:
                all_valid = False
                yield f"Edge {i+1} is still invalid: {reason}", None, cube
        
        if all_valid:
            yield "All pieces are now valid!", None, cube
        else:
            yield "Warning: Some pieces are still invalid.", None, cube
        
        # Return the final solution
        yield f"Solution complete with {len(moves)} moves", None, cube

def main():
    root = tk.Tk()
    app = CubeVisualizer(root)
    root.mainloop()

if __name__ == "__main__":
    main()