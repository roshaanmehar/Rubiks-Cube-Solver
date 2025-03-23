# from twophase import solve, solve_best, solve_best_generator

import kociemba 

# solve("uuuuuuuuufffrrrrrrlllffffffdddddddddbbbllllllrrrbbbbbb")

# solve_best("uuuuuuuuufffrrrrrrlllffffffdddddddddbbbllllllrrrbbbbbb")

# solve_best_generator("uuuuuuuuufffrrrrrrlllffffffdddddddddbbbllllllrrrbbbbbb")

cube1 = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"

cube2 = "UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB"

cube3 = "UUUUUUUUURRLRRRRRRBBFFFFFFFDDDDDDDDDLLRLLLLLLFFBBBBBBB"

cube4 = "ybwwwgybobygorbyyobowggywrbbyrrybgogggooorowrrwrrbgwwy"

cube5 ="oworwoborgyyrrgbwyrbwwgbobrbyygybywowgwrorrywgogobybgg"

cube6 = "wrgwwggrbwyywrobrbywoggorbrwoywyyryygboyorwgbrbogbboog"

cube = "booywrggbwwwwrryywroorgyywyoogyyboorwwybobgrrrbbgbgggb"

print(cube)

cube = cube.replace('w', 'U')
cube = cube.replace('r', 'R')
cube = cube.replace('g', 'F')
cube = cube.replace('y', 'D')
cube = cube.replace('o', 'L')
cube = cube.replace('b', 'B')


print(cube)

solution = kociemba.solve(str(cube))

print(solution)