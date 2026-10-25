# => Buggy: any single part makes the brief sendable.
# => An incomplete brief slips through.
brief = {"goal": "archive drafts"}  # => only the goal is stated
# => scope, done, and guardrails are missing
parts = ["goal", "scope", "done", "guardrails"]  # => the four required parts
sendable = any(p in brief for p in parts)  # => BUG: any() passes on one part alone
# => should require every part
print("parts present: %d of %d" % (sum(1 for p in parts if p in brief), len(parts)))  # => Output: parts present: 1 of 4
print("sendable: " + str(sendable))  # => Output: sendable: True, wrongly
