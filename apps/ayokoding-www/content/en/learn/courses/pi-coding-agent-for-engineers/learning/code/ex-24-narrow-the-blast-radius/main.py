# Example 24: Narrow the Blast Radius
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => OPTIONS maps each situation to its route.
OPTIONS = {  # => the routing table
    # => Row: one file routes to approve now.
    "one file": "approve now",  # => the one file route
    # => Row: one directory routes to approve with tests.
    "one directory": "approve with tests",  # => the one directory route
    # => Row: whole repo routes to split first.
    "whole repo": "split first",  # => the whole repo route
}  # => the closed table
situation = "one directory"  # => today's situation
# => A dict lookup is the whole decision procedure.
route = OPTIONS[situation]  # => the chosen route
print("situation:", situation)  # => Output states the input
print("route:", route)  # => Output states the route
