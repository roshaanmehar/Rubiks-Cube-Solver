# from twophase import solve, solve_best, solve_best_generator

import kociemba 

# solve("uuuuuuuuufffrrrrrrlllffffffdddddddddbbbllllllrrrbbbbbb")

# solve_best("uuuuuuuuufffrrrrrrlllffffffdddddddddbbbllllllrrrbbbbbb")

# solve_best_generator("uuuuuuuuufffrrrrrrlllffffffdddddddddbbbllllllrrrbbbbbb")

cube1 = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"

cube = "UUUUUUUUUBBBRRRRRRRRRFFFFFFDDDDDDDDDFFFLLLLLLLLLBBBBBB"

print(cube)

solution = kociemba.solve(str(cube))

print(solution)