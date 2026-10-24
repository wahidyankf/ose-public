# => Weighted score from normalised leg numbers.
# => Worse leg anchors each scale at zero.
weights = {"correctness": 0.5, "tokens": 0.2, "turns": 0.15, "review": 0.15}  # => the Example 71 scorecard weights
# => review burden replaces its long name
legs = {"openclaw": {"correct": 1.0, "tokens": 8400, "turns": 6, "review": 1}, "sibling": {"correct": 1.0, "tokens": 11200, "turns": 9, "review": 2}}  # => both legs: correctness 0/1, lower costs better
# => review counts findings to re-check
worst_tokens = max(v["tokens"] for v in legs.values())  # => worse leg anchors the token scale
# => worst_tokens is 11200
worst_turns = max(v["turns"] for v in legs.values())  # => worse leg anchors the turn scale
# => worst_turns is 9
worst_review = max(v["review"] for v in legs.values())  # => worse leg anchors the review scale
# => worst_review is 2
scores = {}  # => scores collects the weighted total per tool
for tool, v in legs.items():  # => score each leg the same way
    norm_tokens = 1.0 - v["tokens"] / worst_tokens  # => cheaper leg scores closer to one
    # => openclaw 0.25, sibling 0.0
    norm_turns = 1.0 - v["turns"] / worst_turns  # => fewer turns scores closer to one
    # => openclaw 0.33, sibling 0.0
    norm_review = 1.0 - v["review"] / worst_review  # => lighter review scores closer to one
    # => openclaw 0.5, sibling 0.0
    total = weights["correctness"] * v["correct"] + weights["tokens"] * norm_tokens + weights["turns"] * norm_turns + weights["review"] * norm_review  # => weighted sum on the shared scale
    # => openclaw 0.675, sibling 0.5
    scores[tool] = total  # => record this leg's total
    # => scores gains both tools
    print("%s: %.3f" % (tool, total))  # => Output: two score lines
winner = max(scores, key=scores.get)  # => highest weighted total wins
# => winner is openclaw
print("winner: " + winner)  # => Output: winner: openclaw
