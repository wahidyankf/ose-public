# => Three snapshots; the middle one breaches.
# => Thresholds decide, not feelings.
snaps = [{"queue": 2, "errors": 0}, {"queue": 48, "errors": 3}, {"queue": 1, "errors": 0}]  # => fixture queue depth plus error count
# => middle snapshot breaches both limits
alarms = 0  # => alarms counts breaching snapshots
for i, snap in enumerate(snaps, start=1):  # => sample each snapshot in order
    bad = (snap["queue"] > 10) or (snap["errors"] > 0)  # => queue over ten or any error alarms
    # => only snapshot two alarms
    print("sample %d: queue=%d errors=%d alarm=%s" % (i, snap["queue"], snap["errors"], bad))  # => Output: three sample lines
    alarms += 1 if bad else 0  # => count only breaching snapshots
    # => alarms reaches 1
print("alarms: %d of %d" % (alarms, len(snaps)))  # => Output: alarms: 1 of 3
print("calm confirmed: %d" % (len(snaps) - alarms))  # => Output: calm confirmed: 2
