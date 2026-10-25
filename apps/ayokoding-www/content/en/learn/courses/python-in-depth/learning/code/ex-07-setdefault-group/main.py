# => Example 7: setdefault materializes each bucket on first use.
# => Buckets keyed by team: grouping turns flat rows into structure.
# => The append line never branches: first and later members share it.
# => defaultdict moves the factory to construction for hot paths.
# => Both forms agree: the transcript proves the same map twice.
pairs = [
    ("red", "ada"),
    ("blue", "grace"),
    ("red", "margaret"),
]  # => team plus member rows
groups = {}  # => team name maps to its member list
for team, member in pairs:  # => one row per iteration
    groups.setdefault(team, []).append(member)  # => WHY setdefault: bucket exists now
print(groups)  # => Output: {'red': ['ada', 'margaret'], 'blue': ['grace']}
from collections import defaultdict  # => factory-declared grouping for hot paths

auto = defaultdict(list)  # => WHY defaultdict: policy declared once, not per use
for team, member in pairs:  # => same rows, no initialization line at all
    auto[team].append(member)  # => every append unconditional by construction
print(dict(auto) == groups)  # => Output: True, both forms build the same map
