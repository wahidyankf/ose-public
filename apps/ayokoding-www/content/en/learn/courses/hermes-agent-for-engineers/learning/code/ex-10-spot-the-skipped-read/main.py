# Example 10: Spot the Skipped Read
# => A tool-use trace is the agent's receipt: each call plus why.
# => Reading it is how you tell a correct step from a confident bluff.
# => The shim freezes one trace so every reader sees the same run.
steps = [
    ("edit", "rewrite pricing without reading it", False),
    ("test", "pytest collects 0 items", False),
    ("read", "src/pricing.py after the fact", True),
]  # => the frozen trace, in call order
# => Walk the trace and mark each step good or suspect.
# => A suspect step is not proof of failure, just where to look.
bad = 0  # => count of steps that fail their own check
for tool, detail, ok in steps:  # => replay each recorded call
    # => The ok flag is the shim's verdict, standing in for yours.
    # => In real life you supply this judgement by reading the diff.
    if not ok:  # => this step smells wrong
        bad += 1  # => count it for the summary line
        print("SUSPECT:", tool, "-", detail)  # => flag it loudly
# => The totals line turns a feeling into a number you can gate on.
print("steps:", len(steps))  # => Output counts every call
# => Zero suspect steps is the bar for an unsupervised run.
print("suspect:", bad)  # => Output counts the flags
