# => Three turns; turn three must reuse a turn-one fact.
# => Carry-forward is verified, never assumed.
turns = ["goal: tidy drafts", "found 4 drafts", "archived 4 drafts per goal"]  # => fixture transcript, oldest first
# => turns has 3 entries (type: list)
for i, text in enumerate(turns, start=1):  # => number turns from 1 for the audit
    print("turn %d: %s" % (i, text))  # => Output: turn 1: goal: tidy drafts, turn 2, turn 3
carried = ("goal" in turns[2]) and ("4 drafts" in turns[2])  # => turn three echoes the goal and the count
# => carried is True
print("turns: %d" % len(turns))  # => Output: turns: 3
print("context carried: " + str(carried))  # => Output: context carried: True
