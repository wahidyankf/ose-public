# Worked Example 22: Mean, Median, and Mode
# => Sinar Abadi and its daily totals are fictional; every cell is fixed.
# => One promo day sells 20 while normal days sell 4 to 6.
# => The statistics module computes the balancing, splitting, repeating centers.
import csv
import statistics

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => The week's daily totals in calendar order.
units = [int(row["units"]) for row in rows]  # => seven observations
# => The mean balances the week: total spread evenly across days.
print("mean:", statistics.mean(units))  # => Output reads 7.0, dragged by the promo
# => The median splits it: half the days below, half above.
print("median:", statistics.median(units))  # => Output reads 5.0, a normal day
# => The mode repeats it: the most common daily total.
print("mode:", statistics.mode(units))  # => Output reads 4, the quiet typical day
