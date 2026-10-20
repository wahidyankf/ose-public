# => Direct execution versus plan-then-act for one goal.
# => The checkpoint is a boolean, not a feeling.
goal = "archive old drafts"  # => the shared goal both runs pursue
# => goal is one plain string
direct = ["list drafts", "move files", "delete originals"]  # => three steps with no pause between them
# => direct has 3 steps (type: list)
plan = ["list drafts", "CHECKPOINT", "move files", "delete originals"]  # => the same steps with a human checkpoint inserted
# => plan has 4 entries (type: list)
print("goal: " + goal)  # => Output: goal: archive old drafts
print("direct steps: %d" % len(direct))  # => Output: direct steps: 3
gaps = [s for s in plan if s == "CHECKPOINT"]  # => find the human checkpoints in the plan
# => gaps holds one checkpoint
print("checkpoints: %d" % len(gaps))  # => Output: checkpoints: 1
approved = True  # => the human reads the plan and approves it
# => approval is explicit fixture data
executed = [s for s in plan if s != "CHECKPOINT"]  # => execution replays the plan minus the checkpoint
# => executed matches direct step for step
print("executed steps: %d" % len(executed))  # => Output: executed steps: 3
print("checkpoint approved: " + str(approved))  # => Output: checkpoint approved: True
