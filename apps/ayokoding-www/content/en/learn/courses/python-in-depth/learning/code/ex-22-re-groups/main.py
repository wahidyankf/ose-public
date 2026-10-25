# => Example 22: named groups document the captured shape.
# => Named groups survive edits that would renumber positions.
# => Absence is data: None means the shape did not match.
import re  # => shape matching for irregular text

line = re.compile(
    r"deploy (?P<version>\d+\.\d+\.\d+) to (?P<target>\w+)"
)  # => WHY compiled: once, at top
match = line.search("deploy 1.2.3 to staging")  # => the shape sought in one line
print(match.group("version"))  # => Output: 1.2.3, named not numbered
print(match.group("target"))  # => Output: staging, self-documenting capture
miss = line.search("deploy staging")  # => no version: shape absent
print(miss)  # => Output: None, absence is data
