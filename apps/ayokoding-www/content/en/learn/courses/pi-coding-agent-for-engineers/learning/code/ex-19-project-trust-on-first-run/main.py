# Example 19: Project Trust on First Run
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => OPTIONS maps each situation to its route.
OPTIONS = {  # => the routing table
    # => Row: own checkout routes to trust always.
    "own checkout": "trust always",  # => the own checkout route
    # => Row: foreign repo routes to ask every time.
    "foreign repo": "ask every time",  # => the foreign repo route
    # => Row: shared machine routes to never trust.
    "shared machine": "never trust",  # => the shared machine route
}  # => the closed table
situation = "own checkout"  # => today's situation
# => A dict lookup is the whole decision procedure.
route = OPTIONS[situation]  # => the chosen route
print("situation:", situation)  # => Output states the input
print("route:", route)  # => Output states the route
