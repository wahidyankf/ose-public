# => One brief id shared by two tool legs.
# => Identical inputs make outcomes comparable.
brief_id = "compare-001"  # => the shared task's identity
# => one id for both legs
legs = [{"tool": "openclaw", "brief": brief_id}, {"tool": "sibling", "brief": brief_id}]  # => two legs, same brief id
# => legs has 2 entries (type: list)
print("brief: " + brief_id)  # => Output: brief: compare-001
for leg in legs:  # => confirm each leg's assignment
    print(leg["tool"] + " runs " + leg["brief"])  # => Output: two leg lines
same = all(leg["brief"] == brief_id for leg in legs)  # => every leg must cite the shared id
# => same is True
print("task sealed: " + str(same))  # => Output: task sealed: True
