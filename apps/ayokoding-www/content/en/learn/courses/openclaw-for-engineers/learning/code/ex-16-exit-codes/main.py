# => Fixture exit codes and the action each one demands.
# => Zero means healthy; anything else names a repair.
codes = {0: "healthy", 1: "config error", 2: "gateway down", 3: "provider unreachable"}  # => the four signals this course recognises
# => codes maps int to meaning (type: dict)
actions = {0: "send work", 1: "run openclaw configure", 2: "restart gateway", 3: "check fallbacks"}  # => one prescribed action per signal
# => actions maps int to repair (type: dict)
for code in [0, 1, 2, 3]:  # => walk every known signal in order
    print("exit %d: %s -> %s" % (code, codes[code], actions[code]))  # => Output: four exit lines, 0 healthy first
probe = 2  # => fixture: tonight the gateway is down
# => probe simulates tonight's health check
print("tonight: " + actions[probe])  # => Output: tonight: restart gateway
