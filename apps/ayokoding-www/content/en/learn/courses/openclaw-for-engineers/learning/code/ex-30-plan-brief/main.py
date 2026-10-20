# => Propose-approve-execute, driven by one brief.
# => Execution must equal the approved plan exactly.
brief_done = "plan approved then executed unchanged"  # => the done condition names plan fidelity
# => brief_done is one plain string
proposed = ["list", "move", "verify"]  # => the agent's proposed three steps
# => proposed has 3 entries (type: list)
print("proposed: " + ", ".join(proposed))  # => Output: proposed: list, move, verify
approved_plan = list(proposed)  # => the human approves the proposal unchanged
# => copy, so later edits cannot alias it
executed = list(approved_plan)  # => execution replays the approved plan
# => executed matches the proposal
faithful = executed == approved_plan  # => True only when execution matches approval
# => faithful is True
print("executed: " + ", ".join(executed))  # => Output: executed: list, move, verify
print("done: " + brief_done)  # => Output: done: plan approved then executed unchanged
print("plan fidelity: " + str(faithful))  # => Output: plan fidelity: True
