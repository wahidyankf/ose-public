# Worked Example 36: Line Chart, Weekly Trend
# => Sinar Abadi and its weekly revenue are fictional; every cell is fixed.
# => Twelve weeks drawn as columns of stars, eight rows tall, peak marked.
# => Fixed height keeps every week on the same scale: the honesty rule.
import csv

# => Chart height in rows; every week shares this one scale.
HEIGHT = 8  # => fixed for the whole chart

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Weekly revenue in millions, in calendar order.
rev = [int(row["revenue"]) for row in rows]  # => twelve observations
# => Scale the tallest week to the full height.
top = max(rev)  # => the peak everything measures against
levels = [round(v / top * HEIGHT) for v in rev]  # => each week in rows
# => Print top row first down to row one.
for band in range(HEIGHT, 0, -1):  # => walk the rows downward
    row = "".join("* " if lv >= band else "  " for lv in levels)  # => build the row
    print(row.rstrip())  # => Output draws the row, no trailing spaces
# => The week axis and the peak label anchor the picture.
print(" ".join(f"{i + 1:2}" for i in range(len(rev))))  # => Output numbers the weeks
print("peak_week_12:", top)  # => Output reads the peak value 41
