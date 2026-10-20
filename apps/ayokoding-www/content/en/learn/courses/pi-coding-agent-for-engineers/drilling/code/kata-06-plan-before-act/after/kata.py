# Kata 6: Plan Before Act
# => Pi shows the plan; the human approves, edits, or vetoes.
# => Files bound the blast radius of the whole task.
# => Wide plans fail review: count files before reading.
goal = "rename one helper"  # => the one-line job
# => Steps are ordered tool calls, oldest first.
steps = ["find callers", "rename symbol", "run tests"]  # => order
# => Every listed file is a file the run may touch.
files = ["src/util.py"]  # => the one-file blast radius
# => The verdict is approve for narrow, veto for wide.
verdict = "vetoed: split it" if len(files) > 3 else "approved"  # => call
# => Print goal, width, and verdict for the record.
print("goal:", goal)  # => Output states the job
print("files:", len(files))  # => Output counts the radius
print("verdict:", verdict)  # => Output records the decision
