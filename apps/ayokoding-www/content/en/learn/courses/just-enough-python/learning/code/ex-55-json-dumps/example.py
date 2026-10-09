"""Example 55: json.dumps."""
# => The resulting JSON string contains a numeric a field.

import json  # => standard-library encoder provides dumps

# Serializes a dict to a JSON-formatted str.
print(json.dumps({"a": 1}))  # => Output: {"a": 1}
