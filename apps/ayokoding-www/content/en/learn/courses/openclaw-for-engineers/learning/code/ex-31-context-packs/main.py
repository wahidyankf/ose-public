# => A three-item context pack and one later question.
# => The pack answers without a round trip.
pack = {"goal": "tidy drafts", "constraint": "keep 2026 files", "decision": "archive, never delete"}  # => goal, constraint, and prior decision travel together
# => pack has 3 items (type: dict)
print("packed items: %d" % len(pack))  # => Output: packed items: 3
question = "may I delete old drafts?"  # => the turn-three question the pack must answer
# => question is one plain string
print("question: " + question)  # => Output: question: may I delete old drafts?
answer = pack["decision"]  # => the pack's decision answers directly
# => answer is archive, never delete
print("answer from pack: " + answer)  # => Output: answer from pack: archive, never delete
reasked = False  # => no round trip was needed
# => reasked records the saved turn
print("re-asked human: " + str(reasked))  # => Output: re-asked human: False
