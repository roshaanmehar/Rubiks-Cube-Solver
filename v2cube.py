
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
mapColorToFace(u, "wwwwwwwww")
mapColorToFace(r, "rrrrrrrrr")
mapColorToFace(f, "ggggggggg")
mapColorToFace(d, "yyyyyyyyy")
mapColorToFace(l, "lllllllll")
mapColorToFace(b, "bbbbbbbbb")

# 4) Test printing a specific sticker (u[1]) or the entire face array
# 8 corners
ulb = u[0] + l[0] + b[2]
urb = u[2] + r[2] + b[0]
ulf = u[6] + l[2] + f[0]
urf = u[8] + r[0] + f[2]
dlf = d[0] + l[8] + f[6]
drf = d[2] + r[6] + f[8]
dlb = d[6] + l[7] + b[8]
drb = d[8] + r[8] + d[6]

print(ulb)
print(urb)
print(ulf)
print(urf)
print(dlf)
print(drf)
print(dlb)
print(drb)