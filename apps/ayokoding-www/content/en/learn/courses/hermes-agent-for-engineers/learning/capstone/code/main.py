# Capstone: Hermes end to end, feature plus bug plus test, with receipts.
# => This unit replays a realistic multi-step repo task against the shim.
# => Add a coupon feature, fix its rounding bug, and update its test gate.
# => Every phase prints receipts: plan, diff, trace verdict, cost, judgement.
# => No network, no key, no live binary: the whole repo fits in dicts.
repo = {"src/coupon.py": "v1", "tests/test_coupon.py": "v1"}  # => frozen repo snapshot
# => Scope names the files; done names the gate; guardrails name the limits.
brief = {
    "task": "coupons",
    "scope": "src+tests",
    "done": "suite green",
    "rails": ["ask-if-schema"],
}  # => the contract
# => Score the brief the same way the worked examples do: four slots.
score = sum(1 for v in brief.values() if v)  # => filled-slot count
plan = ["write repro", "add coupon", "fix rounding", "run suite"]  # => ordered moves
# => Each tuple pairs the tool with its reason, the way real traces do.
trace = [
    ("read", "coupon path"),
    ("edit", "add coupon"),
    ("edit", "fix rounding"),
    ("test", "suite green"),
]  # => frozen replay
# => Diffs are sized per file so the review knows its surface.
# => Two files touched, both named in the brief: no scope creep to chase.
diff = {
    "src/coupon.py": (14, 3),
    "tests/test_coupon.py": (18, 2),
}  # => added and removed per file
changed = sum(a + r for a, r in diff.values())  # => the surface to read
# => Cost is priced at the pinned rates, same as every worked example.
# => Fifteen turns of mixed reads and edits stay inside one dollar.
cost = 45000 / 1000 * 0.003 + 15000 / 1000 * 0.015  # => session spend
gate = "suite green"  # => the bar the brief stated up front
# => Print the receipts in task order so the overview can quote them.
print("brief-score:", score, "of 4")  # => Output grades the contract
# => The plan length shows the moves the human approved before acting.
print("plan-steps:", len(plan))  # => Output counts the moves
# => The trace length proves every move left a record behind it.
print("trace-steps:", len(trace))  # => Output counts the records
# => Changed lines size the review a human still had to perform.
print("lines-changed:", changed)  # => Output sizes the review
# => The spend line keeps the bottom-line cost on the same record.
print("session-cost: %.4f" % cost)  # => Output is dollars
# => The judgement names what the maker corrected: one over-broad plan.
# => Correction is the deliverable: the shim never hides the human edit.
print("corrected: split schema out of plan")  # => the human fix
# => The gate line closes the receipt: green means shippable.
print("gate:", gate)  # => Output states the done proof
