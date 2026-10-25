# => Snapshot, update, failed check, rollback.
# => The old version survives until the new one proves out.
running = "v2026.10.4"  # => the currently running fixture release
# => snapshot preserves this string
snapshot = running  # => snapshot the working version first
# => strings copy by value
running = "v2026.10.5"  # => apply the fixture update
# => running now names the new release
print("updated to: " + running)  # => Output: updated to: v2026.10.5
healthy = False  # => fixture: the new release fails its check
# => health is explicit data, never assumed
print("health check: " + str(healthy))  # => Output: health check: False
running = running if healthy else snapshot  # => failed check restores the snapshot
# => running returns to v2026.10.4
print("serving: " + running)  # => Output: serving: v2026.10.4
print("rollback worked: " + str(running == snapshot))  # => Output: rollback worked: True
