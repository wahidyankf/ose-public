# => 46 seconds split three ways.
# => Largest share sets the optimisation target.
parts = {"model wait": 30, "tool time": 12, "overhead": 4}  # => fixture seconds per latency part
# => parts has 3 entries (type: dict)
total = sum(parts.values())  # => the session total in seconds
# => total is 46
print("total: %ds" % total)  # => Output: total: 46s
for name, secs in parts.items():  # => report each part with its share
    print("%s: %ds (%d%%)" % (name, secs, 100 * secs // total))  # => Output: three part lines
target = max(parts, key=parts.get)  # => the part with the most seconds wins
# => target is model wait
print("optimise first: " + target)  # => Output: optimise first: model wait
