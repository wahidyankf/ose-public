# Example 44: Human Gate Mid Session
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => A plan names goal, steps, and files before acting.
# => Pi shows this; the human approves, edits, or vetoes.
goal = "drop legacy column"  # => the one-line job
# => Steps are ordered tool calls, oldest first.
steps = [  # => the proposed sequence
    # => Step: read callers.
    "read callers",  # => one ordered step
    # => Step: drop column.
    "drop column",  # => one ordered step
    # => Step: run suite.
    "run suite",  # => one ordered step
]  # => the closed sequence
# => Files bound the blast radius of the whole task.
files = [  # => every path the plan may touch
    # => File: db/schema.sql stays inside the blast radius.
    "db/schema.sql",  # => one scoped path
    # => File: src/reports.py stays inside the blast radius.
    "src/reports.py",  # => one scoped path
]  # => the closed file list
# => The cap below is this course's rule of thumb.
wide = len(files) > 3  # => True means split it up
# => The verdict is approve for narrow, veto for wide.
if wide:  # => wide plans fail review
    # => Veto splits wide work into reviewable phases.
    verdict = "vetoed: split it"  # => split into phases
else:  # => narrow plans earn fast approval
    # => Approval records the human decision.
    verdict = "approved after human gate"  # => the recorded decision
# => Print goal, width, and verdict for the record.
print("goal:", goal)  # => Output states the job
print("files:", len(files))  # => Output counts them
print("verdict:", verdict)  # => Output records it
