# => A task invocation is a dict with three required fields.
# => The gateway acknowledgement below is fixture text.
task = {"command": "openclaw agent run"}  # => the CLI entry point for a one-shot task
task["workspace"] = "/srv/notes"  # => the directory the agent may touch
# => task now has two of three fields
task["goal"] = "summarise inbox.md in five bullets"  # => plain-language goal, the third required field
# => task is now complete (type: dict)
required = ["command", "workspace", "goal"]  # => the three fields every task must carry
missing = [f for f in required if f not in task]  # => list any required field the task forgot
# => missing is [] for this well-formed task
print("missing fields: %d" % len(missing))  # => Output: missing fields: 0
ack = {"session": "ses-001", "state": "accepted"}  # => fixture acknowledgement from the gateway
# => session ids look like ses-001 here
print("session: " + ack["session"])  # => Output: session: ses-001
print("state: " + ack["state"])  # => Output: state: accepted
sendable = len(missing) == 0  # => only a complete task may be sent
# => sendable is True
print("sendable: " + str(sendable))  # => Output: sendable: True
