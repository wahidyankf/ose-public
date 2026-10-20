# => One exec call, two candidate argument strings.
# => Chained shell operators are the rejection signal.
allowed = ["ls", "wc", "cat"]  # => the only binaries this policy permits
# => allowed has 3 entries (type: list)
calls = ["ls drafts", "ls drafts; rm -rf /"]  # => the second call chains a destructive command
# => calls has 2 entries (type: list)
results = []  # => results collects the verdict per call
for cmd in calls:  # => inspect each call's arguments
    binary = cmd.split()[0]  # => the binary is the first whitespace token
    # => binary is ls for both calls
    chained = (";" in cmd) or ("&&" in cmd)  # => chaining operators signal smuggled commands
    # => chained is False, then True
    ok = (binary in allowed) and (not chained)  # => allowed binary AND no chaining wins
    # => results become [True, False]
    results.append(ok)  # => record this call's verdict
    print(cmd + " -> " + str(ok))  # => Output: ls drafts -> True, then the chained call -> False
print("rejected: %d" % results.count(False))  # => Output: rejected: 1
