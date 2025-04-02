from collections import Counter

text = """
wybgwygywyogwgrbbrrrrgrwyrworgyywwgbgwoooorbyygobbboob
"""

# Remove newlines and count occurrences of letters
all_letters = text.replace("\n", "").replace(" ", "")  # Remove newlines & spaces
letter_count = Counter(all_letters)  # Count occurrences of each letter

# Print the results
for letter, count in letter_count.items():
    print(f"{letter}: {count}")
