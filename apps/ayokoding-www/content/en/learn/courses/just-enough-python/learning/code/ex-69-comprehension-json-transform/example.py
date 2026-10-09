"""Example 69: Comprehension + JSON Transform."""
# => The output file contains uppercase copies of the three names.

import json  # => imports the standard-library json module

with open("people.json") as f:  # => opens the source data file for reading
    people: list[dict[str, str]] = json.load(f)  # => a list of {"name": ...} records

# Builds a NEW list -- the original `people` list is untouched.
uppercased: list[dict[str, str]] = [
    {"name": p["name"].upper()} for p in people
]  # => new records hold uppercase names without changing people

# Writes the transformed list to a separate output file, not overwriting the source.
with open("people_out.json", "w") as f:  # => write mode creates a separate output file
    json.dump(uppercased, f)  # => serializes uppercased directly to the open file

# Reopening proves the write actually landed on disk, not just in memory.
with open("people_out.json") as f:  # => reopens the file just written, to verify it
    print(json.load(f))  # => prints records restored from the written JSON file
# => Output: [{'name': 'ADA'}, {'name': 'GRACE'}, {'name': 'ALAN'}]
