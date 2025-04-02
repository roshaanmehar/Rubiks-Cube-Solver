
# 1) Define arrays (lists of length 9) for each face
u = [None] * 9  # Up
r = [None] * 9  # Right
f = [None] * 9  # Front
d = [None] * 9  # Down
l = [None] * 9  # Left
b = [None] * 9  # Back

# 2) Define a function that maps a 9-character string to the face array
def mapColorToFace(faceArr, faceString):
    if len(faceString) != 9:
        raise ValueError("Input string must be 9 characters only")

    for i in range(9):
        faceArr[i] = faceString[i]

# 3) Map each face to the desired 9-character color string
mapColorToFace(u, "yyyyyyyyy")
mapColorToFace(r, "rrrrrrrrr")
mapColorToFace(f, "ggggggggg")
mapColorToFace(d, "ddddddddd")
mapColorToFace(l, "lllllllll")
mapColorToFace(b, "bbbbbbbbb")

# 4) Test printing a specific sticker (u[1]) or the entire face array
print(u[1])  # Should print 'y'
print(u)     # Should print ['y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y']
