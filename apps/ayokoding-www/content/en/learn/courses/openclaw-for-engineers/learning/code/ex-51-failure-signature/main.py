# => Ten log lines; the timeout signature repeats thrice.
# => Shared signatures mean systemic causes.
lines = ["ses-001 ok", "ses-002 provider-timeout", "ses-001 ok", "ses-003 provider-timeout", "ses-002 retry ok", "ses-004 ok", "ses-003 retry ok", "ses-005 provider-timeout", "ses-004 ok", "ses-005 retry ok"]  # => fixture sessions with three timeouts
# => lines has 10 entries (type: list)
sig = "provider-timeout"  # => the failure signature to hunt
# => sig is one plain string
hits = [l for l in lines if sig in l]  # => collect lines carrying the signature
# => hits has 3 entries (type: list)
print("lines scanned: %d" % len(lines))  # => Output: lines scanned: 10
for h in hits:  # => show every hit in scan order
    print("hit: " + h)  # => Output: three hit lines
sessions = sorted(set(h.split()[0] for h in hits))  # => distinct session ids sharing the signature
# => sessions is ses-002, ses-003, ses-005
print("shared by: " + ", ".join(sessions))  # => Output: shared by: ses-002, ses-003, ses-005
print("systemic: " + str(len(sessions) >= 2))  # => Output: systemic: True
