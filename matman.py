import numpy as np

def strmat(matstring):
    """Converts a string representation of a matrix to a NumPy array."""
    matrix = [list(row.strip()) for row in matstring.strip().split("\n")]
    return np.array(matrix)

matstring = """www
wrr
yyw"""

matrix = strmat(matstring)

print(np.array2string(matrix, separator=' '))