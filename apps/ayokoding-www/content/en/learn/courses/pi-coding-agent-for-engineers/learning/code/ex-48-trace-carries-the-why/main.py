# Example 48: Trace Carries the Why
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => STEPS replays the agent's own tool-call record.
# => Each triple is kind, detail, and whether it was sound.
STEPS = [  # => the frozen trace under review
    ("read", "config to find the timeout key", True),  # => read
    ("edit", "raise timeout 5s to 30s", True),  # => edit
    ("test", "replay the slow webhook", True),  # => test
]  # => order is call order, oldest first
# => Sound steps pass review; the rest need a human.
# => Counting first keeps the verdict mechanical.
sound = [s for s in STEPS if s[2]]  # => the passing steps
suspect = [s for s in STEPS if not s[2]]  # => the failing ones
# => Print both counts before naming any names.
print("sound:", len(sound), "suspect:", len(suspect))  # => Output counts
# => Then print each step so the log reads like a story.
for kind, detail, ok in STEPS:  # => walk the frozen trace
    print(kind, "|", detail)  # => Output shows the step
