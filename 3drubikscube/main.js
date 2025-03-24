document.addEventListener('DOMContentLoaded', () => {
    // Initialize the cube
    const container = document.getElementById('cube-container');
    const cube = new RubiksCube(container);
    
    // Set up UI elements
    const faceSelect = document.getElementById('face-select');
    const faceEditor = document.getElementById('face-editor');
    const faceGrid = document.getElementById('face-grid');
    const rotationDirection = document.getElementById('rotation-direction');
    
    // Face editor instance
    let faceEditorInstance = null;
    
    // Set up face selection
    cube.onFaceSelected = (face) => {
        faceSelect.value = face;
        updateFaceEditor(face);
    };
    
    faceSelect.addEventListener('change', (e) => {
        const face = e.target.value;
        if (face) {
            updateFaceEditor(face);
        } else {
            // Hide face editor if no face selected
            faceEditor.classList.add('hidden');
        }
    });
    
    // Update face editor
    function updateFaceEditor(face) {
        faceEditor.classList.remove('hidden');
        
        if (faceEditorInstance) {
            faceEditorInstance.update(cube.cubeState[face]);
        } else {
            faceEditorInstance = new CubeFaceEditor(
                faceGrid,
                face,
                cube.cubeState[face],
                (index, color) => {
                    cube.setFaceColor(face, index, color);
                }
            );
        }
    }
    
    // Set up rotation buttons
    document.getElementById('rotate-front').addEventListener('click', () => {
        cube.rotateFace('front', rotationDirection.value);
    });
    
    document.getElementById('rotate-back').addEventListener('click', () => {
        cube.rotateFace('back', rotationDirection.value);
    });
    
    document.getElementById('rotate-up').addEventListener('click', () => {
        cube.rotateFace('up', rotationDirection.value);
    });
    
    document.getElementById('rotate-down').addEventListener('click', () => {
        cube.rotateFace('down', rotationDirection.value);
    });
    
    document.getElementById('rotate-left').addEventListener('click', () => {
        cube.rotateFace('left', rotationDirection.value);
    });
    
    document.getElementById('rotate-right').addEventListener('click', () => {
        cube.rotateFace('right', rotationDirection.value);
    });
});