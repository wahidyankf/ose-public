# => Buggy: raw totals decide.
# => Tokens swamp correctness.
legs = {"openclaw": {"correct": 1, "tokens": 8400}, "sibling": {"correct": 0, "tokens": 100}}  # => sibling is wrong but nearly free
# => raw totals favour the sibling
score = {t: v["correct"] + v["tokens"] for t, v in legs.items()}  # => BUG: adding points to tokens
# => scale decides, not quality
winner = min(score, key=score.get)  # => lowest raw total wins here
# => winner is the wrong sibling
print("openclaw raw: %d" % score["openclaw"])  # => Output: openclaw raw: 8401
print("sibling raw: %d" % score["sibling"])  # => Output: sibling raw: 100
print("winner: " + winner)  # => Output: winner: sibling, wrongly
