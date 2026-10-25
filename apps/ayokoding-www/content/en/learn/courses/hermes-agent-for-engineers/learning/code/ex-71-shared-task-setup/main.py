# Example 71: Shared Task Setup
# => Plan-then-act: the agent proposes steps before touching files.
# => A plan you can veto beats a diff you must revert.
# => The shim freezes one proposed plan for a stated goal.
goal = "fix the coupon rounding bug"  # => the task in one sentence
steps = [
    "write repro test",
    "fix rounding",
    "run suite",
]  # => the proposed plan, in order
files = ["src/coupon.py", "tests/test_coupon.py"]
# => A plan is reviewable only when its blast radius is listed.
# => Count the files before you argue about the steps.
print("goal:", goal)  # => Output states the task
# => Numbered steps print in order so review follows the sequence.
print("steps:", len(steps))  # => how many moves the plan makes
# => The file list is the approve-or-veto surface.
print("files:", len(files))  # => Output sizes the blast radius
