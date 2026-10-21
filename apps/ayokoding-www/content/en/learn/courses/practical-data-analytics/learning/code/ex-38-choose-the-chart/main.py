# Worked Example 38: Choosing the Right Chart
# => Sinar Abadi and its owner questions are fictional; every cell is fixed.
# => Three questions meet the decision table; each leaves with a chart.
# => Routing as data: the table is checkable, taste is not required.
import csv

# => The decision table: question kind to encoding, stated as data.
TABLE = {
    "compare categories": "bar",
    "change over time": "line",  # => two question kinds
    "distribution shape": "histogram",
}  # => and the third kind

# => Open the committed fixture of owner questions.
with open(
    "questions.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Route each question through the table and print the assignment.
for row in rows:  # => visit each owner question once
    chart = TABLE[row["kind"]]  # => the table decides, not taste
    print(row["qid"], "->", chart)  # => Output prints the routing
# => The parts-of-a-whole question must never leave with a line.
whole = [r for r in rows if r["kind"] == "compare categories"]  # => category questions
print("category_routes:", {TABLE[r["kind"]] for r in whole})  # => Output shows bar only
