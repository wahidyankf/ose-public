# => Six turns against a budget of five.
# => The cap halts the replay, not the task's value.
budget = 5  # => the task may consume at most five turns
# => budget is one plain int
turns = ["plan", "read", "edit", "test", "fix", "retest"]  # => six fixture turns in order
# => turns has 6 entries (type: list)
used = 0  # => used counts consumed turns
for turn in turns:  # => replay each turn while budget lasts
    if used >= budget:  # => the cap halts before turn six
        print("HALT at budget: " + turn + " skipped")  # => Output: HALT at budget: retest skipped
        break  # => stop consuming; re-brief instead
    used += 1  # => consume one turn of budget
    # => used reaches 5
    print("turn %d: %s" % (used, turn))  # => Output: five turn lines
print("used %d of %d" % (used, budget))  # => Output: used 5 of 5
print("overrun blocked: " + str(used <= budget))  # => Output: overrun blocked: True
