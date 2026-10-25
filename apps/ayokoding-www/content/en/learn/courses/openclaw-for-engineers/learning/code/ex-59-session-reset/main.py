# => Two facts survive; the tangled rest is dropped.
# => Export first, reset second, reimport third.
session = {"goal": "tidy", "loops": 9, "facts": ["keep 2026", "archive, never delete"], "noise": ["retry", "retry"]}  # => tangled session: facts buried in noise
# => session has 4 keys (type: dict)
exported = list(session["facts"])  # => export the two facts worth keeping
# => copy, so reset cannot take them
print("exported facts: %d" % len(exported))  # => Output: exported facts: 2
session = {}  # => reset: the tangled session is dropped whole
# => reset is one assignment, no surgery
print("session after reset: %d keys" % len(session))  # => Output: session after reset: 0 keys
session["facts"] = exported  # => reimport the kept facts first
# => the fresh session starts with signal
session["goal"] = "tidy"  # => restate the goal in the clean session
# => goal anchors the resumed work
print("fresh facts: " + ", ".join(session["facts"]))  # => Output: fresh facts: keep 2026, archive, never delete
print("reset clean: " + str("noise" not in session and "loops" not in session))  # => Output: reset clean: True
