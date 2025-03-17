const Cube = require('cubejs');

// Create a new random cube state
const randomCube = Cube.random();

console.log(randomCube.toJSON());  // Log the cube state to see the random state
