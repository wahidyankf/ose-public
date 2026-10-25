# Example 18: Switch Approval Modes
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => OPTIONS maps each situation to its route.
OPTIONS = {  # => the routing table
    # => Row: explore code routes to read-only mode.
    "explore code": "read-only mode",  # => the explore code route
    # => Row: edit code routes to ask mode.
    "edit code": "ask mode",  # => the edit code route
    # => Row: ship release routes to full mode + review.
    "ship release": "full mode + review",  # => the ship release route
}  # => the closed table
situation = "edit code"  # => today's situation
# => A dict lookup is the whole decision procedure.
route = OPTIONS[situation]  # => the chosen route
print("situation:", situation)  # => Output states the input
print("route:", route)  # => Output states the route
