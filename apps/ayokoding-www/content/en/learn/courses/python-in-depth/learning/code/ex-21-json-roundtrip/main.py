# => Example 21: canonical JSON makes configs diffable.
# => Sort keys plus indent: canonical text diffs cleanly.
# => Loads returns plain types: boundaries stay portable.
# => Nested access works before and after the round trip.
# => Same input always serializes alike: formatting is pinned.
# => Configs as data: reviewable, diffable, golden-testable.
import json  # => the interchange module: text to objects and back

config = {
    "retries": 3,
    "name": "deploy",
    "tags": ["web", "api"],
}  # => plain-type payload
text = json.dumps(
    config, sort_keys=True, indent=2
)  # => WHY canonical: stable key order
print(text.splitlines()[1].strip())  # => Output: "name": "deploy", sorted first key
back = json.loads(text)  # => WHY loads: exterior text becomes interior dict
print(back == config)  # => Output: True, round trip lossless
print(back["tags"][1])  # => Output: api, nested access works
