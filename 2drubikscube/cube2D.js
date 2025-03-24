// Constants for the Rubik's Cube
const FACE_COLORS = {
    front: 0xff0000, // Red
    back: 0xffa500,  // Orange
    up: 0x0000ff,    // Blue
    down: 0x00ff00,  // Green
    left: 0xffa500,  // Orange
    right: 0xff0000, // Red
    white: 0xffffff, // White
    yellow: 0xffff00 // Yellow
};

// 2D layout configuration
const LAYOUT_2D = {
    up: { row: 0, col: 3, rowSpan: 3, colSpan: 3 },
    left: { row: 3, col: 0, rowSpan: 3, colSpan: 3 },
    front: { row: 3, col: 3, rowSpan: 3, colSpan: 3 },
    right: { row: 3, col: 6, rowSpan: 3, colSpan: 3 },
    yellow: { row: 3, col: 9, rowSpan: 3, colSpan: 3 },
    down: { row: 6, col: 3, rowSpan: 3, colSpan: 3 }
};

class Cube2D {
    constructor() {
        this.container = document.getElementById('cube-container');
        this.centerColor = "white";
        this.selectedSticker = null;
        this.rotationDirection = "clockwise";
        
        // Initialize cube state
        this.initCubeState();
        
        // Initialize UI
        this.initUI();
        
        // Render the cube
        this.render();
        
        // Initialize color picker
        this.initColorPicker();
    }
    
    initCubeState() {
        // Initialize the cube state with standard colors
        this.cubeState = {
            front: Array(9).fill(FACE_COLORS.front),
            back: Array(9).fill(FACE_COLORS.back),
            up: Array(9).fill(FACE_COLORS.up),
            down: Array(9).fill(FACE_COLORS.down),
            left: Array(9).fill(FACE_COLORS.left),
            right: Array(9).fill(FACE_COLORS.right),
            white: Array(9).fill(FACE_COLORS.white),
            yellow: Array(9).fill(FACE_COLORS.yellow)
        };
    }
    
    initUI() {
        // Set up center color selection
        const centerColorSelect = document.getElementById('center-color');
        centerColorSelect.addEventListener('change', (e) => {
            this.centerColor = e.target.value;
            this.render();
        });
        
        // Set up rotation direction
        const rotationDirectionSelect = document.getElementById('rotation-direction');
        rotationDirectionSelect.addEventListener('change', (e) => {
            this.rotationDirection = e.target.value;
        });
        
        // Set up rotation buttons
        document.getElementById('rotate-front').addEventListener('click', () => {
            this.rotateFace('front');
        });
        
        document.getElementById('rotate-back').addEventListener('click', () => {
            this.rotateFace('back');
        });
        
        document.getElementById('rotate-up').addEventListener('click', () => {
            this.rotateFace('up');
        });
        
        document.getElementById('rotate-down').addEventListener('click', () => {
            this.rotateFace('down');
        });
        
        document.getElementById('rotate-left').addEventListener('click', () => {
            this.rotateFace('left');
        });
        
        document.getElementById('rotate-right').addEventListener('click', () => {
            this.rotateFace('right');
        });
    }
    
    initColorPicker() {
        const modal = document.getElementById('color-picker-modal');
        const colorPicker = document.getElementById('color-picker');
        const closeButton = document.getElementById('close-color-picker');
        
        // Set up color options
        const colorOptions = colorPicker.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = parseInt(option.dataset.color, 16);
                
                if (this.selectedSticker) {
                    const { face, index } = this.selectedSticker;
                    this.setFaceColor(face, index, color);
                    modal.classList.add('hidden');
                    this.selectedSticker = null;
                }
            });
        });
        
        // Set up close button
        closeButton.addEventListener('click', () => {
            modal.classList.add('hidden');
            this.selectedSticker = null;
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                this.selectedSticker = null;
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.classList.add('hidden');
                this.selectedSticker = null;
            }
        });
    }
    
    render() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create 2D layout
        const layout = document.createElement('div');
        layout.className = 'cube-2d';
        
        // Create faces based on the layout
        Object.entries(LAYOUT_2D).forEach(([face, position]) => {
            // Skip yellow face if center is white, and vice versa
            if ((face === 'yellow' && this.centerColor === 'yellow') || 
                (face === 'white' && this.centerColor === 'white')) {
                return;
            }
            
            const faceElement = document.createElement('div');
            faceElement.className = 'face-2d';
            faceElement.style.gridRow = `${position.row + 1} / span ${position.rowSpan}`;
            faceElement.style.gridColumn = `${position.col + 1} / span ${position.colSpan}`;
            
            // Create stickers
            for (let i = 0; i < 9; i++) {
                const sticker = document.createElement('div');
                sticker.className = 'sticker';
                if (i === 4) sticker.className += ' center';
                
                // Set color
                const color = this.cubeState[face][i];
                sticker.style.backgroundColor = '#' + color.toString(16).padStart(6, '0');
                
                // Add index number
                sticker.textContent = i;
                
                // Add click handler
                sticker.addEventListener('click', () => {
                    this.handleStickerClick(face, i);
                });
                
                faceElement.appendChild(sticker);
            }
            
            layout.appendChild(faceElement);
        });
        
        this.container.appendChild(layout);
    }
    
    handleStickerClick(face, index) {
        // Don't allow changing center stickers
        if (index === 4) return;
        
        this.selectedSticker = { face, index };
        
        // Show color picker
        const modal = document.getElementById('color-picker-modal');
        modal.classList.remove('hidden');
    }
    
    setFaceColor(face, index, color) {
        // Don't allow changing center stickers
        if (index === 4) return;
        
        this.cubeState[face][index] = color;
        this.render();
    }
    
    rotateFace(face) {
        const isClockwise = this.rotationDirection === 'clockwise';
        
        // Update the cube state
        const newState = this.updateCubeStateAfterRotation(face, isClockwise);
        this.cubeState = newState;
        
        // Re-render the cube
        this.render();
    }
    
    updateCubeStateAfterRotation(face, clockwise) {
        const newState = {};
        Object.keys(this.cubeState).forEach(f => {
            newState[f] = [...this.cubeState[f]];
        });
        
        // Helper function to rotate a face
        const rotateFace = (face, clockwise) => {
            const oldFace = [...newState[face]];
            
            if (clockwise) {
                // Rotate clockwise
                newState[face][0] = oldFace[6];
                newState[face][1] = oldFace[3];
                newState[face][2] = oldFace[0];
                newState[face][3] = oldFace[7];
                newState[face][4] = oldFace[4]; // Center stays the same
                newState[face][5] = oldFace[1];
                newState[face][6] = oldFace[8];
                newState[face][7] = oldFace[5];
                newState[face][8] = oldFace[2];
            } else {
                // Rotate counter-clockwise
                newState[face][0] = oldFace[2];
                newState[face][1] = oldFace[5];
                newState[face][2] = oldFace[8];
                newState[face][3] = oldFace[1];
                newState[face][4] = oldFace[4]; // Center stays the same
                newState[face][5] = oldFace[7];
                newState[face][6] = oldFace[0];
                newState[face][7] = oldFace[3];
                newState[face][8] = oldFace[6];
            }
        };
        
        // Rotate the face itself
        rotateFace(face, clockwise);
        
        // Rotate the adjacent faces
        switch (face) {
            case "front":
                if (clockwise) {
                    // up -> right -> down -> left -> up
                    const temp = [newState.up[6], newState.up[7], newState.up[8]];
                    [newState.right[0], newState.right[3], newState.right[6]] = [newState.up[8], newState.up[7], newState.up[6]];
                    [newState.down[2], newState.down[1], newState.down[0]] = [newState.right[6], newState.right[3], newState.right[0]];
                    [newState.left[8], newState.left[5], newState.left[2]] = [newState.down[0], newState.down[1], newState.down[2]];
                    [newState.up[6], newState.up[7], newState.up[8]] = [newState.left[2], newState.left[5], newState.left[8]];
                } else {
                    // up -> left -> down -> right -> up
                    const temp = [newState.up[6], newState.up[7], newState.up[8]];
                    [newState.left[2], newState.left[5], newState.left[8]] = [newState.up[6], newState.up[7], newState.up[8]];
                    [newState.down[0], newState.down[1], newState.down[2]] = [newState.left[8], newState.left[5], newState.left[2]];
                    [newState.right[6], newState.right[3], newState.right[0]] = [newState.down[2], newState.down[1], newState.down[0]];
                    [newState.up[8], newState.up[7], newState.up[6]] = [newState.right[0], newState.right[3], newState.right[6]];
                }
                break;
                
            case "back":
                if (clockwise) {
                    // up -> left -> down -> right -> up
                    const temp = [newState.up[0], newState.up[1], newState.up[2]];
                    [newState.left[0], newState.left[3], newState.left[6]] = [newState.up[2], newState.up[1], newState.up[0]];
                    [newState.down[8], newState.down[7], newState.down[6]] = [newState.left[0], newState.left[3], newState.left[6]];
                    [newState.right[8], newState.right[5], newState.right[2]] = [newState.down[6], newState.down[7], newState.down[8]];
                    [newState.up[0], newState.up[1], newState.up[2]] = [newState.right[2], newState.right[5], newState.right[8]];
                } else {
                    // up -> right -> down -> left -> up
                    const temp = [newState.up[0], newState.up[1], newState.up[2]];
                    [newState.right[2], newState.right[5], newState.right[8]] = [newState.up[0], newState.up[1], newState.up[2]];
                    [newState.down[6], newState.down[7], newState.down[8]] = [newState.right[8], newState.right[5], newState.right[2]];
                    [newState.left[0], newState.left[3], newState.left[6]] = [newState.down[8], newState.down[7], newState.down[6]];
                    [newState.up[2], newState.up[1], newState.up[0]] = [newState.left[0], newState.left[3], newState.left[6]];
                }
                break;
                
            case "up":
                if (clockwise) {
                    // back -> right -> front -> left -> back
                    const temp = [newState.back[0], newState.back[1], newState.back[2]];
                    [newState.right[0], newState.right[1], newState.right[2]] = [newState.back[0], newState.back[1], newState.back[2]];
                    [newState.front[0], newState.front[1], newState.front[2]] = [newState.right[0], newState.right[1], newState.right[2]];
                    [newState.left[0], newState.left[1], newState.left[2]] = [newState.front[0], newState.front[1], newState.front[2]];
                    [newState.back[0], newState.back[1], newState.back[2]] = [newState.left[0], newState.left[1], newState.left[2]];
                } else {
                    // back -> left -> front -> right -> back
                    const temp = [newState.back[0], newState.back[1], newState.back[2]];
                    [newState.left[0], newState.left[1], newState.left[2]] = [newState.back[0], newState.back[1], newState.back[2]];
                    [newState.front[0], newState.front[1], newState.front[2]] = [newState.left[0], newState.left[1], newState.left[2]];
                    [newState.right[0], newState.right[1], newState.right[2]] = [newState.front[0], newState.front[1], newState.front[2]];
                    [newState.back[0], newState.back[1], newState.back[2]] = [newState.right[0], newState.right[1], newState.right[2]];
                }
                break;
                
            case "down":
                if (clockwise) {
                    // front -> right -> back -> left -> front
                    const temp = [newState.front[6], newState.front[7], newState.front[8]];
                    [newState.right[6], newState.right[7], newState.right[8]] = [newState.front[6], newState.front[7], newState.front[8]];
                    [newState.back[6], newState.back[7], newState.back[8]] = [newState.right[6], newState.right[7], newState.right[8]];
                    [newState.left[6], newState.left[7], newState.left[8]] = [newState.back[6], newState.back[7], newState.back[8]];
                    [newState.front[6], newState.front[7], newState.front[8]] = [newState.left[6], newState.left[7], newState.left[8]];
                } else {
                    // front -> left -> back -> right -> front
                    const temp = [newState.front[6], newState.front[7], newState.front[8]];
                    [newState.left[6], newState.left[7], newState.left[8]] = [newState.front[6], newState.front[7], newState.front[8]];
                    [newState.back[6], newState.back[7], newState.back[8]] = [newState.left[6], newState.left[7], newState.left[8]];
                    [newState.right[6], newState.right[7], newState.right[8]] = [newState.back[6], newState.back[7], newState.back[8]];
                    [newState.front[6], newState.front[7], newState.front[8]] = [newState.right[6], newState.right[7], newState.right[8]];
                }
                break;
                
            case "left":
                if (clockwise) {
                    // up -> back -> down -> front -> up
                    const temp = [newState.up[0], newState.up[3], newState.up[6]];
                    [newState.back[8], newState.back[5], newState.back[2]] = [newState.up[0], newState.up[3], newState.up[6]];
                    [newState.down[0], newState.down[3], newState.down[6]] = [newState.back[8], newState.back[5], newState.back[2]];
                    [newState.front[0], newState.front[3], newState.front[6]] = [newState.down[0], newState.down[3], newState.down[6]];
                    [newState.up[0], newState.up[3], newState.up[6]] = [newState.front[0], newState.front[3], newState.front[6]];
                } else {
                    // up -> front -> down -> back -> up
                    const temp = [newState.up[0], newState.up[3], newState.up[6]];
                    [newState.front[0], newState.front[3], newState.front[6]] = [newState.up[0], newState.up[3], newState.up[6]];
                    [newState.down[0], newState.down[3], newState.down[6]] = [newState.front[0], newState.front[3], newState.front[6]];
                    [newState.back[8], newState.back[5], newState.back[2]] = [newState.down[0], newState.down[3], newState.down[6]];
                    [newState.up[0], newState.up[3], newState.up[6]] = [newState.back[8], newState.back[5], newState.back[2]];
                }
                break;
                
            case "right":
                if (clockwise) {
                    // up -> front -> down -> back -> up
                    const temp = [newState.up[8], newState.up[5], newState.up[2]];
                    [newState.front[8], newState.front[5], newState.front[2]] = [newState.up[8], newState.up[5], newState.up[2]];
                    [newState.down[8], newState.down[5], newState.down[2]] = [newState.front[8], newState.front[5], newState.front[2]];
                    [newState.back[0], newState.back[3], newState.back[6]] = [newState.down[8], newState.down[5], newState.down[2]];
                    [newState.up[8], newState.up[5], newState.up[2]] = [newState.back[0], newState.back[3], newState.back[6]];
                } else {
                    // up -> back -> down -> front -> up
                    const temp = [newState.up[8], newState.up[5], newState.up[2]];
                    [newState.back[0], newState.back[3], newState.back[6]] = [newState.up[8], newState.up[5], newState.up[2]];
                    [newState.down[8], newState.down[5], newState.down[2]] = [newState.back[0], newState.back[3], newState.back[6]];
                    [newState.front[8], newState.front[5], newState.front[2]] = [newState.down[8], newState.down[5], newState.down[2]];
                    [newState.up[8], newState.up[5], newState.up[2]] = [newState.front[8], newState.front[5], newState.front[2]];
                }
                break;
        }
        
        // Also update the center faces (white/yellow) based on the rotations
        this.updateCenterFaces(newState);
        
        return newState;
    }
    
    updateCenterFaces(newState) {
        // Update white and yellow faces based on the rotation
        // This is a simplified approach - in a real cube, these would be affected by rotations
        // of adjacent faces
        
        // For now, we'll just copy the corresponding stickers from the main faces
        if (this.centerColor === "white") {
            // White is in the center (front)
            newState.white = [...newState.front];
            
            // Yellow is opposite (back)
            newState.yellow = [...newState.back];
        } else {
            // Yellow is in the center (front)
            newState.yellow = [...newState.front];
            
            // White is opposite (back)
            newState.white = [...newState.back];
        }
    }
}

// Initialize the cube when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const cube = new Cube2D();
});