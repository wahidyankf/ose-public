# Example 55: Double Escape to Safety
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Every stuck session shows one recognizable symptom.
# => Naming it picks the recovery instead of flailing.
symptom = "runaway multi-tool burst"  # => what the engineer observes
# => The recovery is the smallest safe intervention.
recovery = "double Escape opens tree view"  # => frozen fix for this symptom
# => Saved work is what survives the intervention.
kept = [  # => frozen list of preserved artifacts
    # => Survivor: transcript to turn 11 stays intact.
    "transcript to turn 11",  # => one preserved artifact
    # => Survivor: staged diff stays intact.
    "staged diff",  # => one preserved artifact
]  # => the closed list
# => Recovery succeeds only when the kept list is whole.
recovered = len(kept) == 2  # => the verdict
# => Print symptom, recovery, kept work, and verdict.
print("symptom:", symptom)  # => Output names the symptom
print("recovery:", recovery)  # => Output names the fix
print("kept:", kept)  # => Output lists survivors
print("recovered:", recovered)  # => Output gives verdict
