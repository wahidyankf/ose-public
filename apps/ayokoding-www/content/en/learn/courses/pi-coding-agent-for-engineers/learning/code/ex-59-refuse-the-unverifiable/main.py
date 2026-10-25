# Example 59: Refuse the Unverifiable
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Every stuck session shows one recognizable symptom.
# => Naming it picks the recovery instead of flailing.
symptom = "claim with no runnable proof"  # => what the engineer observes
# => The recovery is the smallest safe intervention.
recovery = "refuse, demand a test gate"  # => frozen fix for this symptom
# => Saved work is what survives the intervention.
kept = [  # => frozen list of preserved artifacts
    # => Survivor: rejected claim quoted stays intact.
    "rejected claim quoted",  # => one preserved artifact
    # => Survivor: gate requirement filed stays intact.
    "gate requirement filed",  # => one preserved artifact
]  # => the closed list
# => Recovery succeeds only when the kept list is whole.
recovered = len(kept) == 2  # => the verdict
# => Print symptom, recovery, kept work, and verdict.
print("symptom:", symptom)  # => Output names the symptom
print("recovery:", recovery)  # => Output names the fix
print("kept:", kept)  # => Output lists survivors
print("recovered:", recovered)  # => Output gives verdict
