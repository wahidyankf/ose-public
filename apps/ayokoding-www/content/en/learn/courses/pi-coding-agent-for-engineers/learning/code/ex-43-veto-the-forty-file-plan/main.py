# Example 43: Veto the Forty File Plan
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => A plan names goal, steps, and files before acting.
# => Pi shows this; the human approves, edits, or vetoes.
goal = "migrate all dates to UTC"  # => the one-line job
# => Steps are ordered tool calls, oldest first.
steps = [  # => the proposed sequence
    # => Step: scan repo.
    "scan repo",  # => one ordered step
    # => Step: rewrite 40 files.
    "rewrite 40 files",  # => one ordered step
    # => Step: migrate database.
    "migrate database",  # => one ordered step
]  # => the closed sequence
# => Files bound the blast radius of the whole task.
files = [  # => every path the plan may touch
    # => File: src/a.py stays inside the blast radius.
    "src/a.py",  # => one scoped path
    # => File: src/b.py stays inside the blast radius.
    "src/b.py",  # => one scoped path
    # => File: db/schema.sql stays inside the blast radius.
    "db/schema.sql",  # => one scoped path
    # => File: tests/test_dates.py stays inside the blast radius.
    "tests/test_dates.py",  # => one scoped path
]  # => the closed file list
# => The cap below is this course's rule of thumb.
wide = len(files) > 3  # => True means split it up
# => The verdict is approve for narrow, veto for wide.
if wide:  # => wide plans fail review
    # => Veto splits wide work into reviewable phases.
    verdict = "vetoed: split it"  # => split into phases
else:  # => narrow plans earn fast approval
    # => Approval records the human decision.
    verdict = "approved"  # => the recorded decision
# => Print goal, width, and verdict for the record.
print("goal:", goal)  # => Output states the job
print("files:", len(files))  # => Output counts them
print("verdict:", verdict)  # => Output records it
