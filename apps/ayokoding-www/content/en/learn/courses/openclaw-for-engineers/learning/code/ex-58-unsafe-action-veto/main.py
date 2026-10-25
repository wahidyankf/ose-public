# => Three actions; one violates the never-delete rule.
# => The veto fires without debate.
rule = "never delete originals"  # => the standing safety rule for this task
# => rule is one plain string
actions = ["copy to archive", "delete originals", "verify copies"]  # => three proposed fixture actions
# => the middle action breaks the rule
kept = []  # => kept collects actions surviving the veto
for action in actions:  # => screen each action against the rule
    banned = "delete originals" in action  # => True only for the rule-breaking action
    # => banned is True once
    print(("VETO " if banned else "OK ") + action)  # => Output: OK copy, VETO delete, OK verify
    if not banned:  # => surviving actions join the kept list
        kept.append(action)  # => kept holds two safe actions
print("surviving: %d of %d" % (len(kept), len(actions)))  # => Output: surviving: 2 of 3
print("rule held: " + rule)  # => Output: rule held: never delete originals
