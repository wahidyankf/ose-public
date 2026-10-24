# Example 59: Flaky Test or Loop
# => A stuck loop repeats one action hoping for a different result.
# => The shim freezes an action history and counts the repeats.
# => Detecting the loop is step one; the recovery preserves work.
actions = [
    "run tests (fail)",
    "run tests (pass)",
    "run tests (fail)",
    "quarantine test",
]  # => the session history, oldest first
stuck_on = "run tests (fail)"  # => the action repeating without progress
# => Count repeats of the suspect action across the whole history.
repeats = sum(1 for a in actions if a == stuck_on)  # => repeat count
# => The limit comes from the brief: bounded retries, then escalate.
stuck = repeats >= 3  # => True declares the session stuck
# => Name the count first so the log shows evidence, not alarm.
print("repeats:", repeats)
# => The recovery order matters: interrupt, snapshot, then redirect.
print("stuck:", stuck)  # => True starts the recovery playbook
# => Work already done is snapshotted before anything is cancelled.
print("recover: interrupt, snapshot, re-brief")  # => the safe order
