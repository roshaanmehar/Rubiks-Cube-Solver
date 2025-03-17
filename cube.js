const Cube = require('cubejs');

// Create a new random cube state
const randomCube = Cube.random();

// Color mapping (index to color)
const colorMapping = ['w', 'r', 'b', 'o', 'g', 'y'];  // [White, Red, Blue, Orange, Green, Yellow]

// Convert the cube's internal state to a color-based representation
function convertToColors(cube) {
    const result = {
        center: cube.center.map(index => colorMapping[index]),
        cp: cube.cp.map(index => colorMapping[index]),
        co: cube.co.map(index => colorMapping[index]),
        ep: cube.ep.map(index => colorMapping[index]),
        eo: cube.eo.map(index => colorMapping[index])
    };
    return result;
}

// Log the cube state with colors
const colorCube = convertToColors(randomCube.toJSON());
console.log(colorCube);
