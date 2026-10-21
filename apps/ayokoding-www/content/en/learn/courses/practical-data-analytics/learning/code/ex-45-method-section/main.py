# Worked Example 45: Writing the Method Section
# => Sinar Abadi and its restock analysis are fictional; every word is fixed.
# => Five lines that let a stranger reproduce the finding from scratch.
# => Method as data: a list printed in fixed order, nothing from memory.
method = [
    ("input", "sales-sep.csv, 12 rows"),  # => the exact fixture
    ("cleaning", "strip+lowercase, ISO dates"),  # => Examples 6 and 8
    ("tools", "python stdlib csv/statistics"),  # => no third-party stack
    ("grouping", "product x month"),  # => Example 18's keys
    ("missing", "median-fill, 1 cell"),
]  # => Example 9's policy, counted
# => Print the block in contract order, runtime pinned as fixed text.
print(
    "runtime: python 3.14 stdlib (csv, statistics, sqlite3)"
)  # => Output pins the runtime
for key, value in method:  # => fixed order, every run
    print(key + ":", value)  # => Output prints each contract line
