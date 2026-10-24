# => Two trees; the risky change lands in the isolated one.
# => Main stays clean until review merges.
trees = {"main": [], "agent-fix": []}  # => both trees start with no agent changes
# => trees maps name to change list (type: dict)
risky = ["rewrite index", "move drafts"]  # => the two risky fixture changes
# => risky has 2 entries (type: list)
trees["agent-fix"].extend(risky)  # => risky work lands in the isolated tree only
# => agent-fix now holds two changes
print("main changes: %d" % len(trees["main"]))  # => Output: main changes: 0
print("agent-fix changes: %d" % len(trees["agent-fix"]))  # => Output: agent-fix changes: 2
reviewed = True  # => fixture: a human reviews the isolated tree
# => review is explicit, never assumed
merged = list(trees["agent-fix"]) if reviewed else []  # => merge only after review passes
# => merged carries both changes
print("merged after review: %d" % len(merged))  # => Output: merged after review: 2
print("main was never touched directly: True")  # => isolation held for the whole task
