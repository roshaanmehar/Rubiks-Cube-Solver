// Opposite colors map
const oppositeColors = {
    'b': 'g',
    'g': 'b',
    'y': 'w',
    'w': 'y',
    'o': 'r',
    'r': 'o'
};

// Function to validate the string
function validateString(inputString) {
    // Check if the input string has exactly 3 letters
    if (inputString.length !== 3) {
        return { status: false, reason: 'The string must be exactly 3 characters long.' };
    }

    // Check if the string contains only valid characters
    const validChars = ['y', 'w', 'r', 'b', 'g', 'o'];
    for (let char of inputString) {
        if (!validChars.includes(char)) {
            return { status: false, reason: `Invalid character '${char}' found. Valid characters are: y, w, r, b, g, o.` };
        }
    }

    // Check if any character appears more than twice
    const charCount = {};
    for (let char of inputString) {
        charCount[char] = (charCount[char] || 0) + 1;
        if (charCount[char] > 2) {
            return { status: false, reason: `The character '${char}' cannot appear more than twice.` };
        }
    }

    // Check if the string contains any opposite pairs
    for (let i = 0; i < inputString.length; i++) {
        for (let j = i + 1; j < inputString.length; j++) {
            if (oppositeColors[inputString[i]] === inputString[j]) {
                return { status: false, reason: `The string contains opposite colors: '${inputString[i]}' and '${inputString[j]}'.` };
            }
        }
    }

    return { status: true, reason: 'ok' };
}

// Get the string from the command line arguments
const inputString = process.argv[2];

// Validate the string
const result = validateString(inputString);

// Output the result
console.log(result.reason);
