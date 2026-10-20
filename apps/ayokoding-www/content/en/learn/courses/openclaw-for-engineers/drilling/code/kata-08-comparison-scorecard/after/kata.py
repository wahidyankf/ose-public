# => Fixed: weights on normalised scales decide.
# => Correctness outweighs cheap failure.
legs = {"openclaw": {"correct": 1.0, "tokens": 8400}, "sibling": {"correct": 0.0, "tokens": 100}}  # => same two legs, same numbers
# => facts did not change
worst = max(v["tokens"] for v in legs.values())  # => worse leg anchors the token scale
# => worst is 8400
scores = {}  # => scores collects weighted totals
for tool, v in legs.items():  # => score each leg the same way
    total = 0.8 * v["correct"] + 0.2 * (1.0 - v["tokens"] / worst)  # => FIX: correctness dominates the weight
    # => openclaw 0.8, sibling 0.198
    scores[tool] = total  # => record this leg's total
    print("%s: %.3f" % (tool, total))  # => Output: two normalised score lines
winner = max(scores, key=scores.get)  # => highest weighted score wins
# => winner is openclaw
print("winner: " + winner)  # => Output: winner: openclaw, correctly
