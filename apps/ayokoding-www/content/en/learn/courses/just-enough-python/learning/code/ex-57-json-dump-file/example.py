"""Example 57: json.dump to a File."""
# => The restored dictionary equals the source after a disk roundtrip.

import json  # => imports the standard-library json module

# json.dump()/json.load() write/read directly to/from a file object -- no
# intermediate string round-trip needed, unlike dumps()/loads().
original: dict[str, int] = {"a": 1, "b": 2}  # => original is {"a": 1, "b": 2}
# "w" opens out.json for writing, truncating it if it already exists.
with open("out.json", "w") as f:  # => write mode creates or truncates out.json
    json.dump(original, f)  # => writes directly to a file object

with open("out.json") as f:  # => reopens out.json for reading (default mode "r")
    restored = json.load(f)  # => reads directly from a file object

print(restored == original)  # => roundtrip preserves the data -- Output: True
