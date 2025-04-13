from flask import Flask, request, jsonify
from flask_cors import CORS
import kociemba
from cube_validator import validate_and_orient

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/solve', methods=['POST'])
def solve_cube_endpoint():
    """API endpoint to validate and solve the cube."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    data = request.get_json()
    required_faces = ['u', 'r', 'f', 'd', 'l', 'b']
    if not all(face in data for face in required_faces):
        return jsonify({"error": f"Missing one or more faces. Required: {required_faces}"}), 400
    
    # Validate and orient the input faces
    kociemba_input_string, error_msg = validate_and_orient(
        data['u'], data['r'], data['f'], data['d'], data['l'], data['b']
    )
    
    if error_msg:
        # Validation/Orientation failed
        return jsonify({"error": error_msg}), 400  # Bad Request
    
    # If validation passed, attempt to solve
    try:
        print(f"Attempting to solve: {kociemba_input_string}")  # Log the input to Kociemba
        solution = kociemba.solve(kociemba_input_string)
        return jsonify({"solution": solution})
    except ValueError as e:
        # Kociemba often uses ValueError for unsolvable states (parity, etc.)
        print(f"Solver ValueError for {kociemba_input_string}: {e}")
        return jsonify({"error": f"Solver Error: {str(e)}"}), 400
    except Exception as e:
        # Catch any other unexpected errors during solving
        print(f"Unexpected Solver Error for {kociemba_input_string}: {e}")
        return jsonify({"error": f"Unexpected Solver Error: {str(e)}"}), 500  # Internal Server Error

if __name__ == '__main__':
    app.run(debug=True, port=5001)