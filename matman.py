import numpy as np

def strmat(matstring):
    """Converts a string representation of a matrix to a NumPy array."""
    matrix = [list(row.strip()) for row in matstring.strip().split("\n")]
    return np.array(matrix)

red = """www
wrr
yyw"""

blue = """rbb
gbg
ggb"""

orange = """wwy
bob
grr"""

white = """boo
ywr
ggb"""

yellow = """oyo
oyo
rbg"""

green = """oyy
ogw
rry"""

# matw = strmat(white)
# matr = strmat(red)
# matg = strmat(green)
# maty = strmat(yellow)
# mato = strmat(orange)
# matb = strmat(blue)

# print(np.array2string(matw, separator=' '))
# print(np.array2string(matr, separator=' '))
# print(np.array2string(matg, separator=' '))
# print(np.array2string(maty, separator=' '))
# print(np.array2string(mato, separator=' '))
# print(np.array2string(matb, separator=' '))

