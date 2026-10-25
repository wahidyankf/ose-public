# => Sibling leg in identical units, same seal.
# => Symmetry keeps the contest honest.
leg = {"tool": "sibling", "correct": True, "tokens": 11200, "turns": 9}  # => fixture sibling result, same units
# => sibling costs more here
openclaw = {"tokens": 8400, "turns": 6}  # => OpenClaw's leg numbers from Example 73
# => reference numbers for the side-by-side
print("tool: " + leg["tool"])  # => Output: tool: sibling
print("tokens: openclaw=%d sibling=%d" % (openclaw["tokens"], leg["tokens"]))  # => Output: tokens: openclaw=8400 sibling=11200
print("turns: openclaw=%d sibling=%d" % (openclaw["turns"], leg["turns"]))  # => Output: turns: openclaw=6 sibling=9
cheaper = openclaw["tokens"] < leg["tokens"]  # => fewer tokens wins the cost line
# => cheaper is True for OpenClaw
print("openclaw cheaper: " + str(cheaper))  # => Output: openclaw cheaper: True
