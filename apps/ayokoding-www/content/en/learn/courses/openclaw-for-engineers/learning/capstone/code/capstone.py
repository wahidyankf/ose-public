# => Capstone: one repository task end to end on the fixture shim.
# => Brief, plan, trace, diffs, test gate, and a written judgement.
brief = {"goal": "add word counts to the digest", "scope": "digest/", "done": "digest shows counts and tests pass", "guardrails": "touch no channel config"}  # => the four-part brief for the whole task
# => every later step cites this brief
print("brief goal: " + brief["goal"])  # => Output: brief goal: add word counts to the digest
plan = ["read digest/", "propose diff", "CHECKPOINT", "apply", "test"]  # => plan-then-act for the multi-step task
# => the checkpoint precedes any apply
print("plan steps: %d" % (len(plan) - 1))  # => Output: plan steps: 4
approved = True  # => fixture: the human approves the proposed diff
# => approval is explicit
trace = ["read digest/today.md", "exec wc -w digest/today.md", "write digest/today.md", "exec link-checker"]  # => the four fixture tool calls executed
# => trace order matches the plan
print("trace calls: %d" % len(trace))  # => Output: trace calls: 4
diffs = {"digest/today.md": 6, "digest/index.md": 4}  # => changed-line counts for the two files
# => both files stay under the size limit
small = all(c <= 10 for c in diffs.values())  # => per-file size rule from Example 11
# => small is True
print("diffs small: " + str(small))  # => Output: diffs small: True
gate = [("counts render", True), ("links resolve", True), ("no channel touched", True)]  # => three test-gate checks with results
# => all three pass here
passed = sum(1 for _, ok in gate if ok)  # => count the green checks
# => passed is 3
print("gate: %d of %d" % (passed, len(gate)))  # => Output: gate: 3 of 3
corrections = ["scoped the brief after a vague first draft", "vetoed one exec with chained flags", "re-ran the gate after fixing a link"]  # => the maker's three honest corrections
# => judgement names real interventions
for c in corrections:  # => state each correction plainly
    print("corrected: " + c)  # => Output: three corrected lines
shipped = approved and small and (passed == len(gate))  # => ship only on approval, size, and a green gate
# => shipped is True
print("shipped: " + str(shipped))  # => Output: shipped: True
