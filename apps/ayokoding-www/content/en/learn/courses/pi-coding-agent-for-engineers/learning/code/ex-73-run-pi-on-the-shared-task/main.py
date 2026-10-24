# Example 73: Run Pi on the Shared Task
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => One shared task, one tool, one recorded outcome.
# => Same job as the sibling run so scores stay fair.
tool = "pi 1.3.0"  # => the tool driving this run
# => The task text is byte-identical across both runs.
task = "add coupon total with test"  # => the shared repeatable job
# => Turns count each model round trip of the run.
turns = 6  # => frozen turn count
# => Tokens count everything the run consumed.
tokens = 9400  # => frozen token total
# => Pass means the test gate went green on this run.
passed = True  # => frozen gate outcome
# => Print tool, task, turns, tokens, and the gate.
print("tool:", tool)  # => Output names the tool
print("task:", task)  # => Output states the job
print("turns:", turns)  # => Output counts the turns
print("tokens:", tokens)  # => Output counts the tokens
print("passed:", passed)  # => Output gives the gate
