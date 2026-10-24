# => OpenClaw leg: correctness plus two cost numbers.
# => Units match the sibling leg exactly.
leg = {"tool": "openclaw", "correct": True, "tokens": 8400, "turns": 6}  # => fixture leg result in scorecard units
# => leg has 4 fields (type: dict)
print("tool: " + leg["tool"])  # => Output: tool: openclaw
print("correct: " + str(leg["correct"]))  # => Output: correct: True
print("tokens: %d" % leg["tokens"])  # => Output: tokens: 8400
print("turns: %d" % leg["turns"])  # => Output: turns: 6
recorded = all(k in leg for k in ["correct", "tokens", "turns"])  # => all three scorecard inputs present
# => recorded is True
print("leg recorded: " + str(recorded))  # => Output: leg recorded: True
