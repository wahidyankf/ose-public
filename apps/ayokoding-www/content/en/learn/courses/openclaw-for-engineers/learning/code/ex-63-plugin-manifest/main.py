# => Three manifest entries, each naming its kind.
# => Kindless entries fail review.
manifest = [{"adds": "tool", "name": "triage"}, {"adds": "channel", "name": "matrix"}, {"adds": "provider", "name": "local-ai"}]  # => fixture manifest: one tool, one channel, one provider
# => manifest has 3 entries (type: list)
kinds = ["tool", "channel", "provider"]  # => the only kinds this course trusts
reviewed = 0  # => reviewed counts entries passing review
for entry in manifest:  # => review each manifest entry
    ok = entry["adds"] in kinds  # => the kind must be a known one
    # => all three pass here
    print(entry["adds"] + ":" + entry["name"] + " ok=" + str(ok))  # => Output: three manifest lines
    reviewed += 1 if ok else 0  # => count only reviewable entries
    # => reviewed reaches 3
print("reviewed: %d of %d" % (reviewed, len(manifest)))  # => Output: reviewed: 3 of 3
print("install reviewable: " + str(reviewed == len(manifest)))  # => Output: install reviewable: True
