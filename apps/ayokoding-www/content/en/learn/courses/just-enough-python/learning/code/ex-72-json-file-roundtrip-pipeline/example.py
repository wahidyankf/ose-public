"""Example 72: JSON File Roundtrip Pipeline."""

# => Only records with truthy active values reach the destination.

import json  # => imports the standard-library json module

with open("in.json") as f:  # => opens the source data file for reading
    records: list[dict[str, object]] = json.load(f)  # => 3 records, mixed active flags

# Drops every record whose "active" field is falsy.
kept: list[dict[str, object]] = [r for r in records if r["active"]]  # => two kept

with open("out.json", "w") as f:  # => opens the destination file for writing
    json.dump(kept, f)  # => serializes the filtered list directly to the open file

# Reopening proves the write landed on disk -- this is a genuine roundtrip, not an assumption.
with open("out.json") as f:  # => reopens the file just written, to verify the result
    print(json.load(f))  # => only the two active=true records survive
