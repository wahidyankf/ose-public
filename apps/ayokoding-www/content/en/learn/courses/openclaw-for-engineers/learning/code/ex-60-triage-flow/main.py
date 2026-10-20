# => Three failures, three matching recoveries.
# => Classification precedes every recovery.
failures = [("exec x4 repeats", "loop"), ("archive assumed empty", "assumption"), ("delete originals proposed", "unsafe")]  # => failure text plus its class
# => failures has 3 entries (type: list)
routes = {"loop": "interrupt and resume", "assumption": "correct and replan", "unsafe": "veto and continue"}  # => the recovery each class earns
# => routes maps class to action (type: dict)
for text, kind in failures:  # => triage each failure in order
    print(text + " [" + kind + "] -> " + routes[kind])  # => Output: three triage lines
print("triaged: %d" % len(failures))  # => Output: triaged: 3
all_routed = all(k in routes for _, k in failures)  # => every failure must have a route
# => all_routed is True
print("every failure routed: " + str(all_routed))  # => Output: every failure routed: True
