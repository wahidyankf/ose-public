# Example 1: Check the Installed Version
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
REPORTED = "1.3.0"  # => what pi --version prints installed
# => The floor is the oldest release this course describes.
MINIMUM = (1, 0, 0)  # => Pi 1.0, the harness baseline
# => Split the dotted string into three text pieces.
parts = REPORTED.split(".")  # => three number strings
# => Integers compare piece by piece as a tuple.
found = tuple(int(piece) for piece in parts)  # => the triple
# => Newer-or-equal means this course still describes you.
ok = found >= MINIMUM  # => True for this release
# => Print the string, the tuple, and the verdict.
print("reported:", REPORTED)  # => Output echoes the version
print("parsed:", found)  # => Output shows the tuple
print("supported:", ok)  # => Output gives the verdict
