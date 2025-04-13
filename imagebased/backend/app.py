from flask import Flask, request, jsonify
from flask_cors import CORS
import kociemba

# Import functions from local modules
from validator import validate_and_orient, VALID_COLORS
from image_processor import process_single_image

app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing requests from your frontend

@app.route('/api/solve_from_images', methods=['POST'])
def solve_cube_from_images_endpoint():
    """API endpoint to solve the cube from 6 uploaded images."""
    if not request.files:
        return jsonify({"error": "No image files found in request"}), 400

    # Use request.files.getlist() to handle potentially multiple files with the same name if needed,
    # but here we expect unique keys from the frontend like 'face_0', 'face_1', etc.
    image_files = request.files.to_dict() # Gets files keyed by their form field name
    if len(image_files) != 6:
         return jsonify({"error": f"Expected 6 image files, received {len(image_files)}"}), 400

    detected_faces = {} # Store results: {'w': 'w..', 'r': 'r..', ...}
    processing_errors = []
    face_details = [] # Store details for better error reporting

    # Process each uploaded image
    # Sort keys to process in a consistent order if keys are like 'face_0', 'face_1' etc.
    sorted_keys = sorted(image_files.keys())

    for key in sorted_keys:
        file_storage = image_files[key]
        try:
            image_bytes = file_storage.read()
            if not image_bytes:
                 raise ValueError("Uploaded file is empty.")

            face_string, center_color = process_single_image(image_bytes)

            if face_string is None:
                # center_color holds the error message from process_single_image
                raise ValueError(f"Processing failed: {center_color}")

            face_details.append({
                "filename": file_storage.filename,
                "detected_center": center_color,
                "detected_string": face_string
            })

            if center_color in detected_faces:
                 # Handle duplicate center detection - might indicate processing error or bad uploads
                 raise ValueError(f"Duplicate center color '{center_color}' detected.")
            if center_color not in VALID_COLORS:
                 raise ValueError(f"Invalid center color '{center_color}' detected.")

            detected_faces[center_color] = face_string

        except ValueError as e:
            processing_errors.append(f"File '{file_storage.filename}': {str(e)}")
        except Exception as e:
            # Catch unexpected errors during processing for a specific file
            import traceback
            print(f"Unexpected error on file {file_storage.filename}: {e}\n{traceback.format_exc()}")
            processing_errors.append(f"File '{file_storage.filename}': Unexpected error.")


    if processing_errors:
         # Provide details about processed faces even if errors occurred
         error_detail = {
             "message": "One or more images could not be processed correctly.",
             "errors": processing_errors,
             "processed_faces": face_details
         }
         return jsonify({"error": error_detail}), 400 # Bad Request

    if len(detected_faces) != 6:
         # Should ideally be caught by the loop errors, but as a fallback
         error_detail = {
             "message": f"Could not identify all 6 unique center colors. Found: {list(detected_faces.keys())}",
             "processed_faces": face_details
         }
         return jsonify({"error": error_detail}), 400

    # We have 6 uniquely identified faces, proceed to validation
    try:
        # Order faces for validation (URFDLB requires w,r,g,y,o,b centers)
        u_str = detected_faces['w']
        r_str = detected_faces['r']
        f_str = detected_faces['g']
        d_str = detected_faces['y']
        l_str = detected_faces['o']
        b_str = detected_faces['b']
    except KeyError as e:
        # This means a required center color wasn't found among the successfully processed images
        error_detail = {
             "message": f"Missing required face with center color: {str(e)}",
             "processed_faces": face_details
         }
        return jsonify({"error": error_detail}), 400

    # Validate and Orient using the imported logic
    kociemba_input_string, error_msg = validate_and_orient(
        u_str, r_str, f_str, d_str, l_str, b_str
    )

    if error_msg:
        # Validation or orientation failed
        error_detail = {
             "message": f"Cube State Validation Failed: {error_msg}",
             "detected_faces_ordered": { # Show what was passed to validator
                'U(w)': u_str, 'R(r)': r_str, 'F(g)': f_str,
                'D(y)': d_str, 'L(o)': l_str, 'B(b)': b_str
             }
         }
        return jsonify({"error": error_detail}), 400 # Bad Request

    # If validation passed, attempt to solve
    try:
        print(f"Attempting to solve with Kociemba string: {kociemba_input_string}")
        # Add timeout? Kociemba is usually fast, but as safety.
        # solution = kociemba.solve(kociemba_input_string, timeout=10)
        solution = kociemba.solve(kociemba_input_string)
        print(f"Solution found: {solution}")
        return jsonify({"solution": solution})

    except ValueError as e:
        # Kociemba often uses ValueError for unsolvable states after validation
        # (e.g., parity errors missed by basic checks, or internal solver state issues)
        print(f"Solver ValueError for {kociemba_input_string}: {e}")
        error_detail = {
             "message": f"Solver Error (likely invalid state despite passing checks): {str(e)}",
             "kociemba_input": kociemba_input_string
         }
        return jsonify({"error": error_detail}), 400 # Bad Request

    except Exception as e:
        # Catch any other unexpected errors during solving
        import traceback
        print(f"Unexpected Solver Error for {kociemba_input_string}: {e}\n{traceback.format_exc()}")
        error_detail = {
             "message": f"Unexpected Solver Error: Please try again.",
             "kociemba_input": kociemba_input_string # May help debugging
         }
        return jsonify({"error": error_detail}), 500 # Internal Server Error

if __name__ == '__main__':
    # For production, use a proper WSGI server like Gunicorn or Waitress
    # Example: gunicorn --workers 4 --bind 0.0.0.0:5001 app:app
    print("Starting Flask server on http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=5001) # Use 0.0.0.0 to be accessible on network