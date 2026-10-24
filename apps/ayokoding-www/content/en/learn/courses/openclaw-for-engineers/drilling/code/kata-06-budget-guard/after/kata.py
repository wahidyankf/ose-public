# => Fixed: the cap halts exactly at budget.
# => No turn runs past the limit.
budget = 3  # => same budget of three turns
# => the limit did not change
turns = ["a", "b", "c", "d"]  # => same four fixture turns
# => facts did not change
used = 0  # => used counts consumed turns
for turn in turns:  # => replay each turn
    if used >= budget:  # => FIX: halt exactly at the cap
        # => turn four never runs
        break  # => the on-time halt
    used += 1  # => consume the turn
    # => used stops at 3
print("used %d of %d" % (used, budget))  # => Output: used 3 of 3, held
