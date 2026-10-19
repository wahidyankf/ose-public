"""Overwrite its own source, proving runs see a temporary copy (fixture)."""

with open("sticky.py", "w") as handle:
    handle.write("vandalized\n")
print("still here")
