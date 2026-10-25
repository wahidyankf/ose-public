# => Fixture status block, shaped like `openclaw status` output.
# => Thresholds are ours: queue depth above 10 means busy.
status = {"process": "up", "port": 18789, "sessions": 2, "queue": 3}  # => four health signals in one dict
# => fixture values describe a calm gateway
print("process: " + status["process"])  # => Output: process: up
print("port: %d" % status["port"])  # => Output: port: 18789
print("sessions: %d" % status["sessions"])  # => Output: sessions: 2
print("queue: %d" % status["queue"])  # => Output: queue: 3
process_ok = status["process"] == "up"  # => the gateway process must report up
# => process_ok is True
queue_ok = status["queue"] <= 10  # => ten or fewer queued items counts as drainable
# => queue_ok is True for a queue of 3
go = process_ok and queue_ok  # => both signals must agree before work is sent
# => go is True
print("go: " + str(go))  # => Output: go: True
