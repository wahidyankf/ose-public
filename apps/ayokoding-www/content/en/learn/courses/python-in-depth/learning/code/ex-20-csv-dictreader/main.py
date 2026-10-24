# => Example 20: the csv module owns quoting and dialects.
# => Readers stay order-free: reordered exports keep working.
# => DictReader keys by header: column order can change freely.
# => Quoted fields survive: the module owns the dialect, not splits.
# => Newline discipline on both opens: endings belong to csv.
# => Scratch removed at the end: fixtures never leak into the repo.
import csv  # => record parsing, not string splitting
import tempfile  # => scratch holds the roster file
import os  # => join plus cleanup

path = os.path.join(tempfile.gettempdir(), "ex20-roster.csv")  # => fixed scratch name
with open(
    path, "w", encoding="utf-8", newline=""
) as handle:  # => WHY newline: csv owns endings
    writer = csv.DictWriter(
        handle, fieldnames=["name", "score"]
    )  # => header-declared columns
    writer.writeheader()  # => the header row names every column
    writer.writerow({"name": "ada", "score": "98"})  # => values keyed, not ordered
    writer.writerow(
        {"name": "grace, r.", "score": "100"}
    )  # => embedded comma: quoted safely
with open(path, encoding="utf-8", newline="") as handle:  # => same policy on read
    rows = list(csv.DictReader(handle))  # => WHY DictReader: order-independent access
print(len(rows))  # => Output: 2, both rows parsed
print(rows[1]["name"])  # => Output: grace, r., quoting handled
print(rows[1]["score"])  # => Output: 100, columns aligned
os.remove(path)  # => scratch removed: no trace left behind
