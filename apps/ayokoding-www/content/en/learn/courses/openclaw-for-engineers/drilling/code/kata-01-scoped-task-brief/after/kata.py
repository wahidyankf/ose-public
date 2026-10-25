# => Fixed: every part must be present.
# => The incomplete brief now blocks.
brief = {"goal": "archive drafts"}  # => still only the goal is stated
# => the brief itself did not change
parts = ["goal", "scope", "done", "guardrails"]  # => the four required parts
sendable = all(p in brief for p in parts)  # => FIX: all() demands every part
# => one of four is not enough
print("parts present: %d of %d" % (sum(1 for p in parts if p in brief), len(parts)))  # => Output: parts present: 1 of 4
print("sendable: " + str(sendable))  # => Output: sendable: False, correctly
