
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
mapColorToFace(u, "012345678")
mapColorToFace(r, "012345678")
mapColorToFace(f, "012345678")
mapColorToFace(d, "012345678")
mapColorToFace(l, "012345678")
mapColorToFace(b, "012345678")

# 4) Test printing a specific sticker (u[1]) or the entire face array
# 8 corners
ulb = u[0] + l[0] + b[2]
urb = u[2] + r[2] + b[0]
ulf = u[6] + l[2] + f[0]
urf = u[8] + r[0] + f[2]
dlf = d[0] + l[8] + f[6]
drf = d[2] + r[6] + f[8]
dlb = d[6] + l[7] + b[8]
drb = d[8] + r[8] + b[6]

# adding edges
ub = u[1] + b[1]
ur = u[5] + r[1]
uf = u[7] + f[1]
ul = u[3] + l[1]
lf = l[5] + f[3]
rf = r[3] + f[5]
rb = r[5] + b[3]
lb = l[3] + b[5]
df = d[1] + f[7]
dr = d[5] + r[7]
db = d[7] + b[7]
dl = d[3] + l[7]

print(ub, ur, uf, ul, lf, rf, rb, lb, df, dr, db, dl)