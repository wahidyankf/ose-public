# Example 3: Install via npm
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => OPTIONS maps each situation to its route.
OPTIONS = {  # => the routing table
    # => Row: node present routes to npm install -g pi.
    "node present": "npm install -g pi",  # => the node present route
    # => Row: no node routes to use the script.
    "no node": "use the script",  # => the no node route
}  # => the closed table
situation = "node present"  # => today's situation
# => A dict lookup is the whole decision procedure.
route = OPTIONS[situation]  # => the chosen route
print("situation:", situation)  # => Output states the input
print("route:", route)  # => Output states the route
