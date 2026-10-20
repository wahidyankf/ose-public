# Example 74: Tie on Tests
# => One agent tool teaches habits; two teach judgement.
# => Compare on a shared repeatable task, never on marketing claims.
# => The shim freezes one scorecard so the method is auditable.
tools = ["hermes", "tool-b"]  # => the contenders on the identical task
criteria = [
    "coverage",
    "flakiness",
    "runtime",
]  # => what good means, fixed before scoring
# => Scores are frozen integers: Hermes is scored like its peers.
# => Freezing the numbers keeps the example honest about being a demo.
scores = {  # => tool mapped to one score per criterion
    "hermes": [2, 1, 1],  # => hermes on each criterion
    "tool-b": [2, 1, 1],  # => tool-b on each criterion
}  # => scorecard closed: every cell filled before comparing
# => Totals decide nothing alone; they only order the discussion.
totals = {t: sum(scores[t]) for t in tools}  # => one total per tool
# => The best total is reported, then interrogated criterion by criterion.
best = max(tools, key=lambda t: totals[t])  # => highest total wins
# => Print every total so the reader can re-weight and disagree.
print("totals:", totals)  # => Output shows the whole table
# => The winner line states the verdict the table supports.
print("best-total:", best)  # => Output names the top scorer
