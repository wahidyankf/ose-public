# => Two review rounds; findings shrink to zero.
# => Only the clean round applies.
rounds = [["vague done line"], []]  # => round one finds one issue, round two is clean
# => rounds has 2 entries (type: list)
applied = False  # => applied stays False until a clean round
for i, findings in enumerate(rounds, start=1):  # => review round by round
    print("round %d findings: %d" % (i, len(findings)))  # => Output: round 1 findings: 1, round 2 findings: 0
    if len(findings) == 0:  # => a clean round earns application
        applied = True  # => the proposal is applied exactly once
        # => applied becomes True in round two
        print("round %d: applied" % i)  # => Output: round 2: applied
print("rounds run: %d" % len(rounds))  # => Output: rounds run: 2
print("applied once clean: " + str(applied))  # => Output: applied once clean: True
