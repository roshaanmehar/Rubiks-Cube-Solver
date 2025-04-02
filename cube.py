class Square:
    def __init__(self, color, face_id):
        self.color = color
        self.face_id = face_id
    
    def __str__(self):
        return f"{self.color} (on face {self.face_id})"


class Face:
    # Positions (for reference):
    #  0 1 2
    #  3 4 5
    #  6 7 8
    def __init__(self, face_id, squares=None):
        self.face_id = face_id
        # Initialize with empty squares if none provided
        self.squares = squares if squares else [None] * 9
    
    def set_square(self, position, color):
        """Set the color of a square at a specific position."""
        self.squares[position] = Square(color, self.face_id)
    
    def get_edge(self, edge):
        """
        Returns the three squares on a specific edge:
          'top': positions 0, 1, 2
          'right': positions 2, 5, 8
          'bottom': positions 6, 7, 8
          'left': positions 0, 3, 6
        """
        if edge == 'top':
            return [self.squares[0], self.squares[1], self.squares[2]]
        elif edge == 'right':
            return [self.squares[2], self.squares[5], self.squares[8]]
        elif edge == 'bottom':
            return [self.squares[6], self.squares[7], self.squares[8]]
        elif edge == 'left':
            return [self.squares[0], self.squares[3], self.squares[6]]
        else:
            raise ValueError(f"Invalid edge: {edge}")
    
    def rotate_clockwise(self):
        """Rotate the face 90 degrees clockwise."""
        old_squares = self.squares.copy()
        
        # Mapping for a 90° clockwise rotation:
        #  0 1 2     6 3 0
        #  3 4 5  -> 7 4 1
        #  6 7 8     8 5 2
        rotation_map = {0: 6, 1: 3, 2: 0,
                        3: 7, 4: 4, 5: 1,
                        6: 8, 7: 5, 8: 2}
        
        for old_pos, new_pos in rotation_map.items():
            self.squares[new_pos] = old_squares[old_pos]
        
        return self 
    
    def rotate_counterclockwise(self):
        """Rotate the face 90 degrees counterclockwise."""
        # Applying three clockwise rotations is equivalent to one counterclockwise rotation.
        self.rotate_clockwise()
        self.rotate_clockwise()
        self.rotate_clockwise()
        return self
    
    def rotate_180(self):
        """Rotate the face 180 degrees."""
        # Two clockwise rotations = 180° turn.
        self.rotate_clockwise()
        self.rotate_clockwise()
        return self
    
    def clone(self):
        """Create a deep copy of this face."""
        new_face = Face(self.face_id)
        for i, square in enumerate(self.squares):
            if square:
                new_face.set_square(i, square.color)
        return new_face
    
    def __str__(self):
        """String representation for debugging."""
        result = f"Face {self.face_id}:\n"
        for i in range(0, 9, 3):
            result += f"{self.squares[i].color} {self.squares[i+1].color} {self.squares[i+2].color}\n"
        return result


class RubiksCube:
    def __init__(self):
        self.faces = {}
        face_ids = ['front', 'right', 'back', 'left', 'up', 'down']
        for face_id in face_ids:
            self.faces[face_id] = Face(face_id)
        
        # Expected center colors for standard orientation
        self.expected_centers = {
            'front': 'G',  # Green
            'right': 'R',  # Red
            'back':  'B',  # Blue
            'left':  'O',  # Orange
            'up':    'W',  # White
            'down':  'Y'   # Yellow
        }
        
        # Define the connections between faces: (face_id, edge) pairs that must match.
        self.connections = [
            # Front face connections
            (('front', 'top'),    ('up',    'bottom')),   # Front top to Up bottom
            (('front', 'right'),  ('right', 'left')),     # Front right to Right left
            (('front', 'bottom'), ('down',  'top')),      # Front bottom to Down top
            (('front', 'left'),   ('left',  'right')),    # Front left to Left right
            
            # Right face connections
            (('right', 'top'),    ('up',    'right')),    
            (('right', 'right'),  ('back',  'left')),    
            (('right', 'bottom'), ('down',  'right')),   
            
            # Back face connections
            (('back', 'top'),     ('up',    'top')),      # Back top to Up top (inverted)
            (('back', 'right'),   ('left',  'left')),     
            (('back', 'bottom'),  ('down',  'bottom')),   # Back bottom to Down bottom (inverted)
            
            # Left face connections
            (('left', 'top'),     ('up',    'left')),     
            (('left', 'bottom'),  ('down',  'left'))
        ]
        
        # Build a dict mapping faces -> connections for easy lookup
        self.face_connections = {}
        for (face1_id, edge1), (face2_id, edge2) in self.connections:
            if face1_id not in self.face_connections:
                self.face_connections[face1_id] = []
            if face2_id not in self.face_connections:
                self.face_connections[face2_id] = []
            self.face_connections[face1_id].append((edge1, face2_id, edge2))
            self.face_connections[face2_id].append((edge2, face1_id, edge1))
    
    def populate_from_images(self, face_data):
        """
        Populate the cube from image processing data.
        face_data should be a dictionary mapping face_id -> list of 9 colors
        """
        for face_id, colors in face_data.items():
            for position, color in enumerate(colors):
                self.faces[face_id].set_square(position, color)
    
    def clone(self):
        """Create a deep copy of this cube."""
        new_cube = RubiksCube()
        for face_id, face in self.faces.items():
            new_cube.faces[face_id] = face.clone()
        return new_cube
    
    def validate_edge(self, face1_id, edge1, face2_id, edge2):
        """
        Check if a specific edge connection is valid (i.e., no matching colors).
        Returns (is_valid, errors).
        """
        face1 = self.faces[face1_id]
        face2 = self.faces[face2_id]
        
        edge1_squares = face1.get_edge(edge1)
        edge2_squares = face2.get_edge(edge2)
        
        # Some connections (back->up or back->down) need reversed indexing
        if (face1_id == 'back' and face2_id == 'up') or \
           (face1_id == 'back' and face2_id == 'down'):
            edge2_squares = list(reversed(edge2_squares))
        
        errors = []
        for i in range(3):
            if edge1_squares[i].color == edge2_squares[i].color:
                errors.append(
                    f"Adjacent squares on face {face1_id} ({edge1}) and "
                    f"face {face2_id} ({edge2}) share color '{edge1_squares[i].color}'."
                )
        
        return (len(errors) == 0), errors
    
    def validate_alignment(self):
        """
        Check if the cube faces are correctly aligned.
        Returns (is_valid, errors, solutions).
        """
        errors = []
        solutions = []
        
        # 1) Check center colors match standard orientation
        center_errors = []
        for face_id, expected_color in self.expected_centers.items():
            center_color = self.faces[face_id].squares[4].color
            if center_color != expected_color:
                center_errors.append(
                    f"Invalid center for {face_id}: expected '{expected_color}', found '{center_color}'."
                )
        
        if center_errors:
            errors.extend(center_errors)
            solutions.append(
                "Center colors don't match standard orientation.\n"
                "Make sure: front=Green, right=Red, back=Blue, left=Orange, up=White, down=Yellow."
            )
        
        # 2) Check color count (should have exactly 9 of each color)
        all_colors = [sq.color for face in self.faces.values() for sq in face.squares]
        color_counts = {}
        for color in all_colors:
            color_counts[color] = color_counts.get(color, 0) + 1
        
        count_errors = []
        for color, count in color_counts.items():
            if count != 9:
                count_errors.append(
                    f"Color '{color}' appears {count} times (should be 9)."
                )
        
        if count_errors:
            errors.extend(count_errors)
            solutions.append(
                "Color counts don't match a valid Rubik's cube. Each color should appear exactly 9 times."
            )
        
        # 3) Check edge alignment
        edge_errors = []
        problematic_faces = set()
        for (face1_id, edge1), (face2_id, edge2) in self.connections:
            is_valid, found_errors = self.validate_edge(face1_id, edge1, face2_id, edge2)
            if not is_valid:
                edge_errors.extend(found_errors)
                problematic_faces.add(face1_id)
                problematic_faces.add(face2_id)
        
        if edge_errors:
            errors.extend(edge_errors)
            # Attempt to find solutions for each problematic face
            for face_id in problematic_faces:
                corrected = self.find_correct_orientation(face_id)
                if corrected:
                    rotation, fixed_edges = corrected
                    solutions.append(
                        f"Rotate face '{face_id}' {rotation} to potentially fix {fixed_edges} edge alignment(s)."
                    )
        
        return (len(errors) == 0), errors, solutions
    
    def find_correct_orientation(self, face_id):
        """
        Try rotating a single face to see if it fixes more edge conflicts.
        Returns (rotation_name, fixed_edge_count) if a better orientation is found, else None.
        """
        original_valid_edges = self.count_valid_edges(face_id)
        best_rotation = None
        best_valid_edges = original_valid_edges
        
        # Try all rotations
        test_cubes = {
            "90° clockwise":        self.clone(),
            "180°":                 self.clone(),
            "90° counterclockwise": self.clone()
        }
        
        test_cubes["90° clockwise"].faces[face_id].rotate_clockwise()
        test_cubes["180°"].faces[face_id].rotate_180()
        test_cubes["90° counterclockwise"].faces[face_id].rotate_counterclockwise()
        
        for rotation_name, rotated_cube in test_cubes.items():
            valid_edges = rotated_cube.count_valid_edges(face_id)
            if valid_edges > best_valid_edges:
                best_rotation = rotation_name
                best_valid_edges = valid_edges
        
        if best_rotation:
            return best_rotation, (best_valid_edges - original_valid_edges)
        return None
    
    def count_valid_edges(self, face_id):
        """
        Count how many valid edges (out of all edges that belong to face_id) exist right now.
        """
        valid_count = 0
        for edge, other_face_id, other_edge in self.face_connections.get(face_id, []):
            is_valid, _ = self.validate_edge(face_id, edge, other_face_id, other_edge)
            if is_valid:
                valid_count += 1
        return valid_count
    
    def __str__(self):
        """Print all faces for debugging."""
        result = "Rubik's Cube:\n"
        for fid, face in self.faces.items():
            result += str(face) + "\n"
        return result


def process_cube_images(image_files):
    """
    Returns a dictionary with 6 faces (keys) and lists of 9 colors (values).
    Currently returns mock data.
    Replace with real image-processing code if needed.
    """
    # Here is the mock data that your script uses by default:
    mock_data = {
        'front': ['W','R','W','B','G','W','Y','W','Y'],
        'right': ['R','B','B','O','R','Y','B','Y','R'],
        'back':  ['R','G','Y','B','B','G','W','Y','G'],
        'left':  ['O','W','O','O','O','Y','G','R','W'],
        'up':    ['G','B','B','R','W','G','Y','W','O'],
        'down':  ['B','G','R','O','Y','R','O','O','G']
    }
    return mock_data


def extract_colors_from_image(image_path):
    """
    A placeholder function that would do real image processing.
    Right now, it returns random colors for demonstration only.
    """
    import random
    colors = ['G', 'R', 'B', 'O', 'W', 'Y']
    return [random.choice(colors) for _ in range(9)]


def main():
    # Normally you'd map each face to an actual image file (photo of that face).
    image_files = {
        'front': "front.jpg",
        'right': "right.jpg",
        'back':  "back.jpg",
        'left':  "left.jpg",
        'up':    "up.jpg",
        'down':  "down.jpg"
    }
    
    # Option 1: Use the mock data from process_cube_images
    face_data = process_cube_images(image_files)
    
    # Option 2 (comment out Option 1 above) and use your own face_data manually:
    #
    # face_data = {
    #     'front': ['Y','B','W','W','G','R','Y','W','W'],
    #     'right': ['R','B','B','O','R','Y','B','Y','R'],
    #     'back':  ['R','G','Y','B','B','G','W','Y','G'],
    #     'left':  ['O','O','G','Y','O','B','W','G','W'],
    #     'up':    ['B','G','O','B','W','W','G','R','O'],
    #     'down':  ['B','G','R','O','Y','R','O','O','G']
    # }
    
    # Option 3 (comment out Option 1 above) to do actual image processing:
    #
    # face_data = {}
    # for face_id, img_path in image_files.items():
    #     face_data[face_id] = extract_colors_from_image(img_path)
    
    # Create and populate the Rubik's Cube
    cube = RubiksCube()
    cube.populate_from_images(face_data)
    
    # Validate the cube
    is_valid, errors, solutions = cube.validate_alignment()
    
    if is_valid:
        print("The cube is valid and correctly aligned!")
    else:
        print("The cube has alignment issues:\n")
        for error in errors:
            print(f"- {error}")
        
        print("\nPossible solutions:")
        if solutions:
            for solution in solutions:
                print(f"- {solution}")
        else:
            print("- No automatic corrections found. Try rotating faces manually.")
        
        print("\nMake sure your cube follows the standard orientation:")
        for face_id, color in cube.expected_centers.items():
            print(f"- {face_id}: {color}")


if __name__ == "__main__":
    main()
