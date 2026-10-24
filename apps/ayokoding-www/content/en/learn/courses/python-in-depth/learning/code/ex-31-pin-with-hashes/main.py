# => Example 31: every pin exact, every artifact hashed.
# => Ranges float: pinning forbids them at the format level.
# => Digests verify bytes: the index is trusted but verified.
# => Install flags close the loop: recorded bytes only, no extras.
import re  # => line-shape checks for the pin format

PIN = re.compile(r"^[a-z0-9_-]+==[^\s]+ \\")  # => WHY shape: name, exact pin, continue
HASH = re.compile(r"^\s*--hash=sha256:[0-9a-f]{64}$")  # => WHY shape: full hex digest

lines = [
    "requests==2.32.3 \\",
    "    --hash=sha256:abcdef" + "0" * 58,
]  # => one pinned entry
print(bool(PIN.match(lines[0])))  # => Output: True, exact pin present
print(bool(HASH.match(lines[1])))  # => Output: True, 64-hex digest present
bare = ["requests>=2.0"]  # => a floating range: the drift the policy forbids
print(bool(PIN.match(bare[0])))  # => Output: False, ranges never pin
