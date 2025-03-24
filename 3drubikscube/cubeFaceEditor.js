class CubeFaceEditor {
    constructor(container, face, colors, onColorChange) {
        this.container = container;
        this.face = face;
        this.colors = colors;
        this.onColorChange = onColorChange;
        this.selectedIndex = null;
        
        this.render();
        this.setupColorPickerModal();
    }
    
    render() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create face grid
        for (let i = 0; i < 9; i++) {
            const square = document.createElement('div');
            square.className = 'face-square';
            if (i === 4) {
                square.className += ' center';
                const letter = document.createElement('span');
                letter.className = 'center-letter';
                letter.textContent = this.face.charAt(0).toUpperCase();
                square.appendChild(letter);
            }
            square.style.backgroundColor = '#' + this.colors[i].toString(16).padStart(6, '0');
            square.dataset.index = i;
            
            square.addEventListener('click', (e) => {
                if (i === 4) return; // Don't allow changing center
                
                // Show color picker
                this.selectedIndex = i;
                this.showColorPicker();
            });
            
            this.container.appendChild(square);
        }
    }
    
    setupColorPickerModal() {
        const modal = document.getElementById('color-picker-modal');
        const closeButton = document.getElementById('close-color-picker');
        
        // Set up close button event listener (only once)
        closeButton.addEventListener('click', () => {
            modal.classList.add('hidden');
            this.selectedIndex = null;
        });
        
        // Add click event to close modal when clicking outside the content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                this.selectedIndex = null;
            }
        });
        
        // Add escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.classList.add('hidden');
                this.selectedIndex = null;
            }
        });
    }
    
    showColorPicker() {
        const modal = document.getElementById('color-picker-modal');
        const colorPicker = document.getElementById('color-picker');
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Set up color options
        const colorOptions = colorPicker.querySelectorAll('.color-option');
        
        // Remove existing event listeners
        colorOptions.forEach(option => {
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
        });
        
        // Add new event listeners
        colorPicker.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                const color = parseInt(option.dataset.color, 16);
                
                if (this.selectedIndex !== null) {
                    this.onColorChange(this.selectedIndex, color);
                    this.selectedIndex = null;
                    modal.classList.add('hidden');
                }
            });
        });
    }
    
    update(colors) {
        this.colors = colors;
        this.render();
    }
}