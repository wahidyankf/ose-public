# Example 57: Correct the Wrong Assumption
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Every stuck session shows one recognizable symptom.
# => Naming it picks the recovery instead of flailing.
symptom = "assumed sqlite, repo uses postgres"  # => what the engineer observes
# => The recovery is the smallest safe intervention.
recovery = "state the correction, rerun plan"  # => frozen fix for this symptom
# => Saved work is what survives the intervention.
kept = [  # => frozen list of preserved artifacts
    # => Survivor: corrected brief stays intact.
    "corrected brief",  # => one preserved artifact
    # => Survivor: passing plan v2 stays intact.
    "passing plan v2",  # => one preserved artifact
]  # => the closed list
# => Recovery succeeds only when the kept list is whole.
recovered = len(kept) == 2  # => the verdict
# => Print symptom, recovery, kept work, and verdict.
print("symptom:", symptom)  # => Output names the symptom
print("recovery:", recovery)  # => Output names the fix
print("kept:", kept)  # => Output lists survivors
print("recovered:", recovered)  # => Output gives verdict
