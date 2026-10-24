# => One assumption meets one contradicting fact.
# => The plan rewrites around the fact.
assumption = "archive/ is empty"  # => the agent's unstated belief, now stated
# => assumption is one plain string
facts = {"archive/ holds": 12}  # => the contradicting fixture fact
# => twelve files already archived
print("assumed: " + assumption)  # => Output: assumed: archive/ is empty
holds = facts["archive/ holds"]  # => read the contradicting fact
# => holds is 12
print("fact: archive holds %d" % holds)  # => Output: fact: archive holds 12
wrong = holds > 0  # => a non-empty archive falsifies the assumption
# => wrong is True
print("assumption wrong: " + str(wrong))  # => Output: assumption wrong: True
plan = "merge, never overwrite archive/"  # => the rewritten plan respects the fact
# => plan is one plain string
print("corrected plan: " + plan)  # => Output: corrected plan: merge, never overwrite archive/
print("resumed on facts: " + str(wrong))  # => Output: resumed on facts: True
