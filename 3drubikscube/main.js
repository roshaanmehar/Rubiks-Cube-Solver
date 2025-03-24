// Main JavaScript file for 3D Rubik's Cube (rubiksCube.js)

// Constants for the Rubik's Cube
const FACE_COLORS = {
    front: 0xff0000, // Red
    back: 0xffa500,  // Orange
    up: 0xffffff,    // White
    down: 0xffff00,  // Yellow
    left: 0x00ff00,  // Green
    right: 0x0000ff, // Blue
};

const FACE_LETTERS = {
    front: "R", // Red
    back: "O",  // Orange
    up: "W",    // White
    down: "Y",  // Yellow
    left: "G",  // Green
    right: "B", // Blue
};

// Define face normals for raycasting
const FACE_NORMALS = {
    front: new THREE.Vector3(0, 0, 1),
    back: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0),
    down: new THREE.Vector3(0, -1, 0),
    left: new THREE.Vector3(-1, 0, 0),
    right: new THREE.Vector3(1, 0, 0),
};

// Main class for the Rubik's Cube
class RubiksCube {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.cubeGroup = null;
        this.rotationGroup = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.cubies = [];
        this.rotatingFace = null;
        this.rotationDirection = "clockwise";
        this.rotationProgress = 0;
        this.isRotating = false;
        this.cubiePositions = new Map();
        this.cubieToFaceIndices = new Map();
        this.selectedFace = null;
        this.animationFrameId = null;
        
        // Initialize the cube state
        this.cubeState = {};
        Object.keys(FACE_COLORS).forEach(face => {
            this.cubeState[face] = Array(9).fill(FACE_COLORS[face]);
        });
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // Create camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(6, 5, 7);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Create controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 15;
        
        // Create cube group
        this.cubeGroup = new THREE.Group();
        this.scene.add(this.cubeGroup);
        
        // Create rotation group
        this.rotationGroup = new THREE.Group();
        this.scene.add(this.rotationGroup);
        
        // Create cubies
        this.createCubies();
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Add event listeners
        window.addEventListener('resize', this.handleResize.bind(this));
        this.container.addEventListener('click', this.handleClick.bind(this));
        
        // Start animation loop
        this.animate();
    }
    
    createCubies() {
        // Clear existing cubies
        while (this.cubeGroup.children.length > 0) {
            this.cubeGroup.remove(this.cubeGroup.children[0]);
        }
        
        this.cubies = [];
        this.cubiePositions.clear();
        this.cubieToFaceIndices.clear();
        
        // Create 27 cubies (3x3x3)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    // Create cubie
                    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
                    const materials = [];
                    
                    // Define materials for each face with default color for inner faces
                    const defaultColor = 0x333333;
                    
                    // Right face (x = 1)
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: x === 1 ? this.cubeState.right[this.getCubieIndexOnFace("right", x, y, z)] : defaultColor,
                            roughness: 0.3,
                            metalness: 0.2,
                        })
                    );
                    
                    // Left face (x = -1)
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: x === -1 ? this.cubeState.left[this.getCubieIndexOnFace("left", x, y, z)] : defaultColor,
                            roughness: 0.3,
                            metalness: 0.2,
                        })
                    );
                    
                    // Up face (y = 1)
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: y === 1 ? this.cubeState.up[this.getCubieIndexOnFace("up", x, y, z)] : defaultColor,
                            roughness: 0.3,
                            metalness: 0.2,
                        })
                    );
                    
                    // Down face (y = -1)
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: y === -1 ? this.cubeState.down[this.getCubieIndexOnFace("down", x, y, z)] : defaultColor,
                            roughness: 0.3,
                            metalness: 0.2,
                        })
                    );
                    
                    // Front face (z = 1)
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: z === 1 ? this.cubeState.front[this.getCubieIndexOnFace("front", x, y, z)] : defaultColor,
                            roughness: 0.3,
                            metalness: 0.2,
                        })
                    );
                    
                    // Back face (z = -1)
                    materials.push(
                        new THREE.MeshStandardMaterial({
                            color: z === -1 ? this.cubeState.back[this.getCubieIndexOnFace("back", x, y, z)] : defaultColor,
                            roughness: 0.3,
                            metalness: 0.2,
                        })
                    );
                    
                    // Create cubie mesh
                    const cubie = new THREE.Mesh(geometry, materials);
                    cubie.position.set(x, y, z);
                    cubie.castShadow = true;
                    cubie.receiveShadow = true;
                    cubie.userData = { x, y, z };
                    this.cubeGroup.add(cubie);
                    this.cubies.push(cubie);
                    
                    // Store cubie position
                    this.cubiePositions.set(cubie, new THREE.Vector3(x, y, z));
                    
                    // Store cubie to face indices mapping
                    const faceIndices = {};
                    if (x === 1) faceIndices.right = this.getCubieIndexOnFace("right", x, y, z);
                    if (x === -1) faceIndices.left = this.getCubieIndexOnFace("left", x, y, z);
                    if (y === 1) faceIndices.up = this.getCubieIndexOnFace("up", x, y, z);
                    if (y === -1) faceIndices.down = this.getCubieIndexOnFace("down", x, y, z);
                    if (z === 1) faceIndices.front = this.getCubieIndexOnFace("front", x, y, z);
                    if (z === -1) faceIndices.back = this.getCubieIndexOnFace("back", x, y, z);
                    this.cubieToFaceIndices.set(cubie, faceIndices);
                    
                    // Add center letters
                    this.addCenterLetters(cubie, x, y, z);
                }
            }
        }
    }
    
    addCenterLetters(cubie, x, y, z) {
        // Only add letters to center cubies of each face
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) !== 1) return;
        
        let face = null;
        let direction = null;
        
        if (x === 1) {
            face = "right";
            direction = new THREE.Vector3(1, 0, 0);
        } else if (x === -1) {
            face = "left";
            direction = new THREE.Vector3(-1, 0, 0);
        } else if (y === 1) {
            face = "up";
            direction = new THREE.Vector3(0, 1, 0);
        } else if (y === -1) {
            face = "down";
            direction = new THREE.Vector3(0, -1, 0);
        } else if (z === 1) {
            face = "front";
            direction = new THREE.Vector3(0, 0, 1);
        } else if (z === -1) {
            face = "back";
            direction = new THREE.Vector3(0, 0, -1);
        }
        
        if (face && direction) {
            const letter = FACE_LETTERS[face];
            
            // Create canvas for the letter
            const canvas = document.createElement("canvas");
            canvas.width = 128;
            canvas.height = 128;
            const context = canvas.getContext("2d");
            
            if (context) {
                context.fillStyle = "#000000";
                context.font = "bold 80px Arial";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText(letter, 64, 64);
                
                // Create texture from canvas
                const texture = new THREE.CanvasTexture(canvas);
                
                // Create letter mesh
                const letterGeometry = new THREE.PlaneGeometry(0.5, 0.5);
                const letterMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide,
                });
                
                const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
                
                // Position the letter slightly in front of the cubie face
                letterMesh.position.copy(direction.clone().multiplyScalar(0.48));
                letterMesh.lookAt(direction.clone().multiplyScalar(2));
                
                cubie.add(letterMesh);
            }
        }
    }
    
    getCubieIndexOnFace(face, x, y, z) {
        let row = 0, col = 0;
        
        switch (face) {
            case "front": // z = 1
                row = 1 - y; // 0, 1, 2 from top to bottom
                col = x + 1; // 0, 1, 2 from left to right
                break;
            case "back": // z = -1
                row = 1 - y; // 0, 1, 2 from top to bottom
                col = 1 - x; // 0, 1, 2 from right to left (mirrored)
                break;
            case "up": // y = 1
                row = 1 - z; // 0, 1, 2 from front to back
                col = x + 1; // 0, 1, 2 from left to right
                break;
            case "down": // y = -1
                row = z + 1; // 0, 1, 2 from back to front
                col = x + 1; // 0, 1, 2 from left to right
                break;
            case "left": // x = -1
                row = 1 - y; // 0, 1, 2 from top to bottom
                col = z + 1; // 0, 1, 2 from back to front
                break;
            case "right": // x = 1
                row = 1 - y; // 0, 1, 2 from top to bottom
                col = 1 - z; // 0, 1, 2 from front to back (mirrored)
                break;
        }
        
        // Convert 2D coordinates to 1D index (0-8)
        return row * 3 + col;
    }
    
    updateCubieColors() {
        this.cubeGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && Array.isArray(child.material)) {
                const position = new THREE.Vector3();
                child.getWorldPosition(position);
                
                // Round the position to account for floating point errors
                const x = Math.round(position.x);
                const y = Math.round(position.y);
                const z = Math.round(position.z);
                
                // Update the materials based on the cube state
                const materials = child.material;
                
                // Only update colors for faces that are on the outside of the cube
                if (x === 1 && materials[0] && materials[0].color) {
                    materials[0].color.setHex(this.cubeState.right[this.getCubieIndexOnFace("right", x, y, z)]);
                }
                if (x === -1 && materials[1] && materials[1].color) {
                    materials[1].color.setHex(this.cubeState.left[this.getCubieIndexOnFace("left", x, y, z)]);
                }
                if (y === 1 && materials[2] && materials[2].color) {
                    materials[2].color.setHex(this.cubeState.up[this.getCubieIndexOnFace("up", x, y, z)]);
                }
                if (y === -1 && materials[3] && materials[3].color) {
                    materials[3].color.setHex(this.cubeState.down[this.getCubieIndexOnFace("down", x, y, z)]);
                }
                if (z === 1 && materials[4] && materials[4].color) {
                    materials[4].color.setHex(this.cubeState.front[this.getCubieIndexOnFace("front", x, y, z)]);
                }
                if (z === -1 && materials[5] && materials[5].color) {
                    materials[5].color.setHex(this.cubeState.back[this.getCubieIndexOnFace("back", x, y, z)]);
                }
            }
        });
    }
    
    updateCubiePositions() {
        this.cubiePositions.clear();
        
        this.cubeGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const position = new THREE.Vector3();
                child.getWorldPosition(position);
                
                // Round the position to account for floating point errors
                position.x = Math.round(position.x);
                position.y = Math.round(position.y);
                position.z = Math.round(position.z);
                
                this.cubiePositions.set(child, position);
            }
        });
    }
    
    updateCubieToFaceIndices() {
        this.cubieToFaceIndices.clear();
        
        this.cubeGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const position = new THREE.Vector3();
                child.getWorldPosition(position);
                
                // Round the position to account for floating point errors
                const x = Math.round(position.x);
                const y = Math.round(position.y);
                const z = Math.round(position.z);
                
                // Store cubie to face indices mapping
                const faceIndices = {};
                if (x === 1) faceIndices.right = this.getCubieIndexOnFace("right", x, y, z);
                if (x === -1) faceIndices.left = this.getCubieIndexOnFace("left", x, y, z);
                if (y === 1) faceIndices.up = this.getCubieIndexOnFace("up", x, y, z);
                if (y === -1) faceIndices.down = this.getCubieIndexOnFace("down", x, y, z);
                if (z === 1) faceIndices.front = this.getCubieIndexOnFace("front", x, y, z);
                if (z === -1) faceIndices.back = this.getCubieIndexOnFace("back", x, y, z);
                
                this.cubieToFaceIndices.set(child, faceIndices);
            }
        });
    }
    
    handleResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    handleClick(event) {
        if (this.isRotating) return;
        
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Get all cubies from the cube group
        const cubies = [];
        this.cubeGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                cubies.push(child);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(cubies);
        
        if (intersects.length > 0) {
            const intersectedCubie = intersects[0].object;
            const faceIndex = Math.floor(intersects[0].faceIndex / 2);
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersectedCubie.matrixWorld);
            const faceNormal = intersects[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();
            
            // Determine which face was clicked
            let clickedFace = null;
            let minAngle = Number.POSITIVE_INFINITY;
            
            Object.entries(FACE_NORMALS).forEach(([face, normal]) => {
                const angle = faceNormal.angleTo(normal);
                if (angle < minAngle) {
                    minAngle = angle;
                    clickedFace = face;
                }
            });
            
            if (clickedFace) {
                this.selectFace(clickedFace);
            }
        }
    }
    
    selectFace(face) {
        this.selectedFace = face;
        
        // Update UI
        const faceSelect = document.getElementById('face-select');
        faceSelect.value = face;
        
        // Show face editor
        this.updateFaceEditor();
        
        // Trigger event for UI update
        const event = new CustomEvent('faceSelected', { detail: { face } });
        document.dispatchEvent(event);
    }
    
    updateFaceEditor() {
        if (!this.selectedFace) return;
        
        const faceEditor = document.getElementById('face-editor');
        const faceGrid = document.getElementById('face-grid');
        
        // Show face editor
        faceEditor.classList.remove('hidden');
        
        // Clear existing grid
        faceGrid.innerHTML = '';
        
        // Create face grid
        const colors = this.cubeState[this.selectedFace];
        for (let i = 0; i < 9; i++) {
            const square = document.createElement('div');
            square.className = 'face-square';
            if (i === 4) {
                square.className += ' center';
                const letter = document.createElement('span');
                letter.className = 'center-letter';
                letter.textContent = this.selectedFace.charAt(0).toUpperCase();
                square.appendChild(letter);
            }
            square.style.backgroundColor = '#' + colors[i].toString(16).padStart(6, '0');
            square.dataset.index = i;
            
            square.addEventListener('click', (e) => {
                if (i === 4) return; // Don't allow changing center
                
                // Remove selected class from all squares
                const squares = faceGrid.querySelectorAll('.face-square');
                squares.forEach(s => s.classList.remove('selected'));
                
                // Add selected class to clicked square
                square.classList.add('selected');
                
                // Show color picker
                const colorPicker = document.getElementById('color-picker');
                colorPicker.classList.remove('hidden');
                colorPicker.dataset.targetIndex = i;
            });
            
            faceGrid.appendChild(square);
        }
    }
    
    rotateFace(face, direction) {
        if (this.isRotating) return;
        
        this.rotatingFace = face;
        this.rotationDirection = direction;
        this.rotationProgress = 0;
        this.isRotating = true;
        
        // Reset rotation group
        this.rotationGroup.rotation.set(0, 0, 0);
        
        // Move cubies from cube group to rotation group based on the face
        const FACE_TO_AXIS = {
            front: { axis: "z", value: 1 },
            back: { axis: "z", value: -1 },
            up: { axis: "y", value: 1 },
            down: { axis: "y", value: -1 },
            left: { axis: "x", value: -1 },
            right: { axis: "x", value: 1 },
        };
        
        const faceInfo = FACE_TO_AXIS[face];
        const cubies = [];
        
        this.cubeGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const position = new THREE.Vector3();
                child.getWorldPosition(position);
                
                // Check if the cubie is on the rotating face
                // We use a small threshold to account for floating point errors
                const threshold = 0.1;
                let isOnFace = false;
                
                if (faceInfo.axis === "x" && Math.abs(position.x - faceInfo.value) < threshold) isOnFace = true;
                else if (faceInfo.axis === "y" && Math.abs(position.y - faceInfo.value) < threshold) isOnFace = true;
                else if (faceInfo.axis === "z" && Math.abs(position.z - faceInfo.value) < threshold) isOnFace = true;
                
                if (isOnFace) {
                    cubies.push(child);
                }
            }
        });
        
        // Move cubies to rotation group
        cubies.forEach(cubie => {
            this.cubeGroup.remove(cubie);
            this.rotationGroup.add(cubie);
        });
        
        // Disable rotation buttons during rotation
        this.updateRotationButtons(true);
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
                    [newState.left[0], newState.left[1], newState.left[2]]  newState.right[2]];
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
        
        return newState;
    }
    
    updateRotationButtons(disabled) {
        const buttons = [
            document.getElementById('rotate-front'),
            document.getElementById('rotate-back'),
            document.getElementById('rotate-up'),
            document.getElementById('rotate-down'),
            document.getElementById('rotate-left'),
            document.getElementById('rotate-right')
        ];
        
        buttons.forEach(button => {
            button.disabled = disabled;
        });
    }
    
    animate() {
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        if (this.controls) {
            this.controls.update();
        }
        
        // Handle face rotation animation
        if (this.rotatingFace && this.isRotating) {
            const rotationSpeed = 0.05;
            const targetRotation = (Math.PI / 2) * (this.rotationDirection === "clockwise" ? 1 : -1);
            
            this.rotationProgress += rotationSpeed;
            
            if (this.rotationProgress >= 1) {
                // Rotation complete
                this.rotationProgress = 0;
                this.isRotating = false;
                
                // Update the cube state based on the rotation
                const newState = this.updateCubeStateAfterRotation(
                    this.rotatingFace, 
                    this.rotationDirection === "clockwise"
                );
                
                // Update cube state
                this.cubeState = newState;
                
                // Move cubies from rotation group back to cube group
                while (this.rotationGroup.children.length > 0) {
                    const cubie = this.rotationGroup.children[0];
                    this.rotationGroup.remove(cubie);
                    this.cubeGroup.add(cubie);
                }
                
                // Update the cubie positions map
                this.updateCubiePositions();
                
                // Update the cubie to face indices map
                this.updateCubieToFaceIndices();
                
                // Update the face editor if a face is selected
                if (this.selectedFace) {
                    this.updateFaceEditor();
                }
                
                // Enable rotation buttons
                this.updateRotationButtons(false);
                
                this.rotatingFace = null;
            } else {
                // Continue rotation
                const ROTATION_AXES = {
                    front: new THREE.Vector3(0, 0, 1),
                    back: new THREE.Vector3(0, 0, -1),
                    up: new THREE.Vector3(0, 1, 0),
                    down: new THREE.Vector3(0, -1, 0),
                    left: new THREE.Vector3(-1, 0, 0),
                    right: new THREE.Vector3(1, 0, 0),
                };
                
                const axis = ROTATION_AXES[this.rotatingFace];
                this.rotationGroup.setRotationFromAxisAngle(
                    axis,
                    targetRotation * this.rotationProgress
                );
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    setFaceColor(face, index, color) {
        if (index === 4) return; // Don't change center
        
        this.cubeState[face][index] = color;
        this.updateCubieColors();
        
        // Update face editor
        if (this.selectedFace === face) {
            this.updateFaceEditor();
        }
    }
    
    dispose() {
        // Clean up resources
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        this.container.removeEventListener('click', this.handleClick);
    }
}

// Initialize the cube when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('cube-container');
    const cube = new RubiksCube(container);
    
    // Set up UI event listeners
    const faceSelect = document.getElementById('face-select');
    faceSelect.addEventListener('change', (e) => {
        const face = e.target.value;
        if (face) {
            cube.selectFace(face);
        } else {
            // Hide face editor if no face selected
            document.getElementById('face-editor').classList.add('hidden');
        }
    });
    
    // Set up color picker
    const colorPicker = document.getElementById('color-picker');
    const colorOptions = colorPicker.querySelectorAll('.color-option');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const color = parseInt(option.dataset.color, 16);
            const index = parseInt(colorPicker.dataset.targetIndex, 10);
            
            if (cube.selectedFace && index !== undefined) {
                cube.setFaceColor(cube.selectedFace, index, color);
                
                // Hide color picker
                colorPicker.classList.add('hidden');
                
                // Remove selected class from all squares
                const squares = document.querySelectorAll('.face-square');
                squares.forEach(s => s.classList.remove('selected'));
            }
        });
    });
    
    // Set up rotation buttons
    const rotationDirection = document.getElementById('rotation-direction');
    
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
    
    // Listen for face selection events
    document.addEventListener('faceSelected', (e) => {
        faceSelect.value = e.detail.face;
    });
});