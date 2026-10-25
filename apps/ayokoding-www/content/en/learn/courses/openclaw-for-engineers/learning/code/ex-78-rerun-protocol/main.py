# => Same seal, new versions, fresh stamp.
# => Drift is reported, never hidden.
seal = "compare-001"  # => the sealed task id from Example 72
# => seal never changes between runs
last = {"openclaw": "v2026.10.4", "date": "2026-09-20"}  # => fixture previous run record
# => last run used the older release
now = {"openclaw": "v2026.10.5", "date": "2026-10-20"}  # => fixture current run record
# => versions and dates are fixture text
print("seal: " + seal)  # => Output: seal: compare-001
drifted = now["openclaw"] != last["openclaw"]  # => True when the release changed since last run
# => drifted is True here
print("version drift: " + str(drifted))  # => Output: version drift: True
print("last: %s @ %s" % (last["openclaw"], last["date"]))  # => Output: last: v2026.10.4 @ 2026-09-20
print("now: %s @ %s" % (now["openclaw"], now["date"]))  # => Output: now: v2026.10.5 @ 2026-10-20
print("re-run stamped: " + now["date"])  # => Output: re-run stamped: 2026-10-20
