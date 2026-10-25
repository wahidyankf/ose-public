# Kata starter: list the touched files, then compare with after/kata.py.
# => Each entry pairs a path with added and removed counts.
files = []  # => TODO: list the touched files
# => Total the change before deciding how carefully to read it.
added = sum(a for _, a, _ in files)  # => every added line proposed
removed = sum(r for _, _, r in files)  # => every removed line proposed
# => Name the slow-review threshold your team agreed on.
threshold = 100  # => lines above this earn the slow read
# => Print the surface size so the reading plan is explicit.
print("lines-changed:", added + removed)  # => Output sizes the review
