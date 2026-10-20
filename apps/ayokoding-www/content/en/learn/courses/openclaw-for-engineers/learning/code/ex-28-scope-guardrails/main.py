# => Scope-guardrail pairs plus one contradictory brief.
# => Contradictions fail the brief before anything runs.
pairs = [("drafts/", "never delete before copying"), ("archive/", "never rename existing files")]  # => two sound scope-guardrail pairs
# => pairs has 2 entries (type: list)
print("pairs: %d" % len(pairs))  # => Output: pairs: 2
for scope, guard in pairs:  # => show each sound pairing
    print(scope + " | " + guard)  # => Output: two scope-guardrail lines
goal = "delete drafts/"  # => a goal that contradicts the first guardrail
# => goal orders exactly what the guard forbids
conflict = ("delete" in goal) and ("never delete" in pairs[0][1])  # => True when goal and guardrail collide
# => conflict is True here
print("conflict: " + str(conflict))  # => Output: conflict: True
print("brief sendable: " + str(not conflict))  # => Output: brief sendable: False
