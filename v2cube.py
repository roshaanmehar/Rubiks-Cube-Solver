# # variables for the up layer
# u0 = u1 = u2 = u3 = u4 = u5 = u6 = u7 = u8 = None
# up = [
#     [u0, u1, u2],
#     [u3, u4, u5],
#     [u6, u7, u8]
# ]


# # variables for the front layer
# f0 = f1 = f2 = f3 = f4 = f5 = f6 = f7 = f8 = None
# front = [
#     [f0, f1, f2],
#     [f3, f4, f5],
#     [f6, f7, f8]
# ]

# # variables for the right layer
# r0 = r1 = r2 = r3 = r4 = r5 = r6 = r7 = r8 = None
# right = [
#     [r0, r1, r2],
#     [r3, r4, r5],
#     [r6, r7, r8]
# ]

# # variables for the down layer
# d0 = d1 = d2 = d3 = d4 = d5 = d6 = d7 = d8 = None
# down = [
#     [d0, d1, d2],
#     [d3, d4, d5],
#     [d6, d7, d8]
# ]

# # variables for the left layer
# l0 = l1 = l2 = l3 = l4 = l5 = l6 = l7 = l8 = None
# left = [
#     [l0, l1, l2],
#     [l3, l4, l5],
#     [l6, l7, l8]
# ]

# # variables for the back layer
# b0 = b1 = b2 = b3 = b4 = b5 = b6 = b7 = b8 = None
# back = [
#     [b0, b1, b2],
#     [b3, b4, b5],
#     [b6, b7, b8]
# ]

faces = {
    "up": [[None, None, None], [None, None, None], [None, None, None]],
    "front": [[None, None, None], [None, None, None], [None, None, None]],
    "right": [[None, None, None], [None, None, None], [None, None, None]],
    "down": [[None, None, None], [None, None, None], [None, None, None]],
    "left": [[None, None, None], [None, None, None], [None, None, None]],
    "back": [[None, None, None], [None, None, None], [None, None, None]],
}
# will implement this later but for the time being i will let it be.
# faceColors = {
#     "up":"yyyyyyyyy",
#     "right":"yyyyyyyyy",
#     "front":"yyyyyyyyy",
#     "down":"yyyyyyyyy",
#     "left":"yyyyyyyyy",
#     "back":"yyyyyyyyy"
# }

def mapColorToFaces(faceName, faceString):
    if len(faceString) != 9:
        raise ValueError("Input string must be 9 characters only")
    faces[faceName] = [
        [faceName[0], faceName[1], faceName[2]],
        [faceName[3], faceName[4], faceName[5]],
        [faceName[6], faceName[7], faceName[8]]
    ]