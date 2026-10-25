# => One audit entry: who ran what, and in which session.
# => Three fields, all required, no exceptions.
entry = {}  # => the audit entry starts empty
entry["who"] = "agent:ses-001"  # => the acting identity, agent plus session
# => entry gains its first field
entry["what"] = "exec: ls drafts"  # => the exact privileged action taken
# => entry gains its second field
entry["session"] = "ses-001"  # => the session that authorises the lookup
# => entry is now complete (type: dict)
required = ["who", "what", "session"]  # => the three fields every entry must carry
missing = [f for f in required if f not in entry]  # => list any field the entry forgot
# => missing is [] here
print("entry fields: %d" % len(entry))  # => Output: entry fields: 3
print("who: " + entry["who"])  # => Output: who: agent:ses-001
print("what: " + entry["what"])  # => Output: what: exec: ls drafts
print("complete: " + str(len(missing) == 0))  # => Output: complete: True
