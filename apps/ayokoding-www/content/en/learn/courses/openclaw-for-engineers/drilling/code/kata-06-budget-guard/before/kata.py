# => Buggy: the cap allows one extra turn.
# => Off-by-one funds the overrun.
budget = 3  # => at most three turns allowed
# => budget is one plain int
turns = ["a", "b", "c", "d"]  # => four fixture turns
# => one more than budget
used = 0  # => used counts consumed turns
for turn in turns:  # => replay each turn
    if used > budget:  # => BUG: halts a turn too late
        # => turn four slips through
        break  # => the late halt
    used += 1  # => consume the turn
    # => used reaches 4, over budget
print("used %d of %d" % (used, budget))  # => Output: used 4 of 3, overrun
