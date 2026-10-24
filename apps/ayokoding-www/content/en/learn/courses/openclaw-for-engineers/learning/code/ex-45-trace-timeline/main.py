# => Five calls with fixture durations in seconds.
# => Slowest-first ordering names the bottleneck.
calls = [("read", 1), ("exec", 4), ("browser", 38), ("exec", 2), ("message", 1)]  # => tool plus seconds for each of five calls
# => browser dominates at 38 seconds
total = sum(d for _, d in calls)  # => add every duration for the session total
# => total is 46 seconds
print("calls: %d total: %ds" % (len(calls), total))  # => Output: calls: 5 total: 46s
ranked = sorted(calls, key=lambda c: c[1], reverse=True)  # => sort slowest-first by duration
# => ranked leads with browser
for tool, secs in ranked:  # => show the timeline slowest-first
    print("%s: %ds" % (tool, secs))  # => Output: five duration lines, browser first
slowest = ranked[0][0]  # => the tool owning the most time
# => slowest is browser
print("bottleneck: " + slowest)  # => Output: bottleneck: browser
print("share: %d%%" % (100 * ranked[0][1] // total))  # => integer share of the slowest step
# => Output: share: 82%
