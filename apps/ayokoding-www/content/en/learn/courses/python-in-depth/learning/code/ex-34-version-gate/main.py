# => Example 34: the floor declared, the runtime checked.
import sys  # => WHY sys: version_info is the machine-readable floor

FLOOR = (3, 10)  # => WHY tuple: the oldest interpreter this code supports
running = (sys.version_info.major, sys.version_info.minor)  # => current pair
print(running >= FLOOR)  # => Output: True, pinned toolchain clears it
print(sys.version_info.major)  # => Output: 3, major pinned by the image
if running >= (3, 11):  # => WHY gate: newer syntax lives behind versions
    print("modern tomllib path")  # => Output: modern tomllib path
else:  # => the fallback for older floors, untested here
    print("legacy path")  # => skipped: the pinned toolchain is newer
