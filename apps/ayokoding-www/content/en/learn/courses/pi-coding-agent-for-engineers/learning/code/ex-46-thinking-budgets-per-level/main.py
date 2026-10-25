# Example 46: Thinking Budgets per Level
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Levels run off, minimal, low, medium, high, xhigh, max.
level = "high"  # => the level chosen for this task
# => Budgets below are illustration caps, not vendor promises.
budgets = {  # => frozen level-to-token map
    # => Level off budgets 0 tokens.
    "off": 0,  # => off budget
    # => Level minimal budgets 500 tokens.
    "minimal": 500,  # => minimal budget
    # => Level low budgets 1500 tokens.
    "low": 1500,  # => low budget
    # => Level medium budgets 4000 tokens.
    "medium": 4000,  # => medium budget
    # => Level high budgets 9000 tokens.
    "high": 9000,  # => high budget
    # => Level xhigh budgets 20000 tokens.
    "xhigh": 20000,  # => xhigh budget
    # => Level max budgets 50000 tokens.
    "max": 50000,  # => max budget
}  # => the closed map
estimate = 7500  # => tokens this task likely needs
# => A level fits when its budget covers the estimate.
fits = estimate <= budgets[level]  # => the fit verdict
# => Print level, budget, and whether the task fits.
print("level:", level)  # => Output names the level
print("budget:", budgets[level])  # => Output shows budget
print("fits:", fits)  # => Output gives the verdict
