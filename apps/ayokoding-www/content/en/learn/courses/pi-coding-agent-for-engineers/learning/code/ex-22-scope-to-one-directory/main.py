# Example 22: Scope to One Directory
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => OPTIONS maps each situation to its route.
OPTIONS = {  # => the routing table
    # => Row: fix the cart routes to scope /srv/notes/shop/src/cart.
    "fix the cart": "scope /srv/notes/shop/src/cart",  # => the fix the cart route
    # => Row: migrate everything routes to refuse: too wide.
    "migrate everything": "refuse: too wide",  # => the migrate everything route
}  # => the closed table
situation = "fix the cart"  # => today's situation
# => A dict lookup is the whole decision procedure.
route = OPTIONS[situation]  # => the chosen route
print("situation:", situation)  # => Output states the input
print("route:", route)  # => Output states the route
