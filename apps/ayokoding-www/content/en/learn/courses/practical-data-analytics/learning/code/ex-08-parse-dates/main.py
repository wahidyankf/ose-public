# Worked Example 8: Parsing Mixed Date Formats
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Three stores export three date shapes in one column.
# => Try each known format, normalize winners to ISO, reject the rest.
import csv
from datetime import datetime

# => The accepted shapes, in the order they are attempted.
FORMATS = ["%Y-%m-%d", "%d/%m/%Y", "%b %d, %Y"]  # => ISO, day-first, short-month


# => Turn one raw cell into ISO text or an explicit None.
def parse(raw):  # => single policy for the whole column
    for fmt in FORMATS:  # => try each accepted shape
        try:  # => attempt this format
            return (
                datetime.strptime(raw.strip(), fmt).date().isoformat()
            )  # => normalize winners
        except ValueError:  # => wrong shape, try the next
            continue  # => keep attempting
    return None  # => no format matched: reject openly


# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Parse the whole column through the one policy.
clean = [parse(row["date"]) for row in rows]  # => ISO strings or Nones
# => Show the normalized column in file order.
print("dates:", clean)  # => Output shows four ISO dates
# => The earliest date anchors every monthly aggregation later.
print("earliest:", min(clean))  # => Output reads 2026-09-01
