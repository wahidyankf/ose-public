# Example 34: Multiline Prompts That Parse
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => A brief is a contract the agent cannot wiggle out of.
task = ""  # => one verb plus one object
scope = "src/mailer/"  # => the boundary of the job
done = "template renders without errors"  # => the measurable finish line
guardrails = ["no live send"]  # => the limits on the run
# => Four of four is submittable; less means rewrite.
slots = [task, scope, done, guardrails]  # => the four slots
score = sum(1 for s in slots if s)  # => count filled slots
# => Print the score so the starting point is on record.
print("brief-score:", score, "of 4")  # => Output grades it
# => The verdict names the bar for reuse elsewhere.
print("submittable:", score == 4)  # => True when complete
