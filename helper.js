// Get the input string from command line arguments
const input = process.argv[2];

// Validation function
function validateString(str) {
  // Check if string is provided
  if (!str) {
    return { valid: false, reason: "No string provided" };
  }
  
  // Check if string is exactly 3 characters
  if (str.length !== 3) {
    return { valid: false, reason: "String must be exactly 3 characters long" };
  }
  
  // Check if string only contains allowed characters
  const allowedChars = ['y', 'w', 'r', 'b', 'g', 'o'];
  for (const char of str) {
    if (!allowedChars.includes(char)) {
      return { valid: false, reason: `Character '${char}' is not allowed. Only y, w, r, b, g, o are allowed` };
    }
  }
  
  // Check if any letter appears more than once
  const charCount = {};
  for (const char of str) {
    charCount[char] = (charCount[char] || 0) + 1;
    if (charCount[char] > 1) {
      return { valid: false, reason: `Character '${char}' appears more than once` };
    }
  }
  
  // Check for opposite letters
  const opposites = {
    'b': 'g', 'g': 'b',
    'y': 'w', 'w': 'y',
    'o': 'r', 'r': 'o'
  };
  
  for (let i = 0; i < str.length; i++) {
    for (let j = i + 1; j < str.length; j++) {
      if (opposites[str[i]] === str[j]) {
        return { valid: false, reason: `Characters '${str[i]}' and '${str[j]}' are opposites and cannot be together` };
      }
    }
  }
  
  // If all checks pass
  return { valid: true, reason: "String meets all requirements" };
}

// Validate the input
const result = validateString(input);

// Output the result
if (result.valid) {
  console.log("ok");
} else {
  console.log(`not ok - ${result.reason}`);
}