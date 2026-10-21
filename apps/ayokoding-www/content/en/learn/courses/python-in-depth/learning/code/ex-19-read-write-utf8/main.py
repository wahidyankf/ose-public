# => Example 19: explicit encoding makes text I/O portable.
# => Scratch lives in the temp dir; only fixed labels reach stdout.
# => Newline stays empty so line endings survive the round trip.
import tempfile  # => scratch space for the round trip
import os  # => join plus cleanup helpers

path = os.path.join(tempfile.gettempdir(), "ex19-names.txt")  # => fixed scratch name
lines = ["ada\n", "grace hopper\n", "margaret\n"]  # => plain ASCII payload lines
with open(
    path, "w", encoding="utf-8", newline=""
) as handle:  # => WHY explicit: no platform default
    handle.writelines(lines)  # => three lines written in UTF-8
with open(path, encoding="utf-8", newline="") as handle:  # => same policy on read
    back = handle.readlines()  # => lines come back whole
print(len(back))  # => Output: 3, every line survived
print(back[1].strip())  # => Output: grace hopper, content intact
os.remove(path)  # => scratch removed: no trace left behind
