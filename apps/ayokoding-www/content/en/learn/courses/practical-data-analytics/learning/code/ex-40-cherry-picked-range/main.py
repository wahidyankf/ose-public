# Worked Example 40: The Cherry-Picked Range
# => Sinar Abadi and its twelve weeks are fictional; every cell is fixed.
# => The last four weeks climb; the full quarter barely moves.
# => Slope over the window versus slope over everything, same formula.
import csv


# => Average week-to-week change: rise over run across the window.
def slope(vals):  # => one formula for both windows
    return (vals[-1] - vals[0]) / (len(vals) - 1)  # => end minus start over steps


# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Twelve weeks of revenue in millions, in calendar order.
rev = [int(row["revenue"]) for row in rows]  # => flat with a noisy end
# => The story the picker tells: last four weeks only.
print("picked_slope:", round(slope(rev[-4:]), 2))  # => Output reads 2.0 per week
# => The story the data tells: all twelve weeks.
print("full_slope:", round(slope(rev), 2))  # => Output reads about 0.18 per week
# => Ten times the slope from a quarter of the data: that is the trick.
print("inflation:", round(slope(rev[-4:]) / slope(rev), 1))  # => Output reads 11.0
