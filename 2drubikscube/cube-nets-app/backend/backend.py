from flask import Flask, request, jsonify
from flask_cors import CORS
import kociemba
import json
import time
from datetime import datetime
from cube_validator import find_valid_orientations

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
    
    # Find all valid orientations
    valid_orientations, debug_info = find_valid_orientations(
        data['u'], data['r'], data['f'], data['d'], data['l'], data['b']
    )
    
    if not valid_orientations:
        # No valid orientations found
        log_results([], debug_info, "No valid orientations found")
        return jsonify({
            "error": "No valid cube orientations found. Check that your cube state is correct.",
            "debug_info": debug_info[:10]  # Send first 10 debug entries to avoid large response
        }), 400
    
    # Try to solve each valid orientation with Kociemba
    solutions = []
    errors = []
    
    for i, orientation in enumerate(valid_orientations):
        try:
            solution = kociemba.solve(orientation)
            solutions.append({
                "orientation_index": i,
                "kociemba_input": orientation,
                "solution": solution
            })
        except Exception as e:
            errors.append({
                "orientation_index": i,
                "kociemba_input": orientation,
                "error": str(e)
            })
    
    # Log all results
    log_results(solutions, errors, debug_info)
    
    if solutions:
        # Return all successful solutions
        return jsonify({
            "solutions": solutions,
            "total_valid_orientations": len(valid_orientations),
            "successful_solutions": len(solutions),
            "failed_solutions": len(errors)
        })
    else:
        # No solutions found despite valid orientations
        return jsonify({
            "error": "No solutions found. All valid orientations failed in the solver.",
            "total_valid_orientations": len(valid_orientations),
            "failed_solutions": len(errors),
            "first_error": errors[0] if errors else "Unknown error"
        }), 400

def log_results(solutions, errors, debug_info):
    """Log all results to a JSON file for debugging."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_data = {
        "timestamp": timestamp,
        "solutions": solutions,
        "errors": errors,
        "debug_info": debug_info
    }
    
    try:
        # Create a unique filename with timestamp
        filename = f"solver_log_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump(log_data, f, indent=2)
        print(f"Log saved to {filename}")
    except Exception as e:
        print(f"Error saving log: {e}")

if __name__ == '__main__':
    app.run(debug=True, port=5001)