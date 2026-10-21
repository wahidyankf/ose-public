# => Kata 4 solution: paths as objects, structure as methods.
from pathlib import PurePosixPath  # => WHY pure: computes, never touches disk

base = PurePosixPath("/data")  # => the directory as an object
print(base / "a.txt")  # => Output: /data/a.txt, join reads as join
full = PurePosixPath("/data/archive.tar.gz")  # => the double-suffix case
print(full.name)  # => Output: archive.tar.gz, no splitting needed
print(full.suffixes)  # => Output: ['.tar', '.gz'], both suffixes kept
print(full.stem)  # => Output: archive.tar, outer suffix removed only
