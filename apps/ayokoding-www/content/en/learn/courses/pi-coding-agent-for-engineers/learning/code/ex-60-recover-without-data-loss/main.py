# Example 60: Recover Without Data Loss
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => The agent proves its change with a run, not a claim.
# => Red before the fix, green after: no skipped middle.
suite = "pytest tests/ -q"  # => the command proving the change
# => Red is the honest baseline on unmodified code.
red = "fail"  # => frozen pre-fix result
# => Green is the same suite after the agent's edit.
green = "pass"  # => frozen post-fix result
# => The gate passes only on the red-then-green pair.
gate = red == "fail" and green == "pass"  # => the gate verdict
print("suite:", suite)  # => Output names the suite
print("before:", red)  # => Output shows the baseline
print("after:", green)  # => Output shows the proof
print("gate:", gate)  # => Output gives the verdict
