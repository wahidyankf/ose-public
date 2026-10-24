# Kata starter: freeze tools and criteria, then compare with after/kata.py.
# => The same task for every tool, or the table lies.
tools = []  # => TODO: name the contending tools
# => Criteria are fixed before scoring, never fitted after.
criteria = []  # => TODO: name what good means
# => Every cell filled before comparing; totals only order debate.
scores = {}  # => TODO: fill the frozen scorecard
# => Print every total so a reader can re-weight and disagree.
totals = {t: sum(scores[t]) for t in tools}  # => one total per tool
# => The best total is reported, then interrogated per criterion.
print("totals:", totals)  # => Output shows the whole table
