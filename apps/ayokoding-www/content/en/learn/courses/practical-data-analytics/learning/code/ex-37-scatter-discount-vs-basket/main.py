# Worked Example 37: Scatter, Discount Against Basket
# => Sinar Abadi and its promo receipts are fictional; every cell is fixed.
# => Ten receipts on a 5-by-5 grid; the cloud slopes up, proving nothing.
# => Grid shows togetherness; words refuse the causal leap.
import statistics

# => Discount percent per receipt, fixed for the lesson.
discount = [0, 5, 5, 10, 10, 15, 15, 20, 20, 25]  # => the suspected lever
# => Basket size in units for the same ten receipts.
basket = [2, 3, 4, 4, 5, 5, 6, 7, 6, 8]  # => the hoped-for response
# => A 5-by-5 grid: rows are basket bands, columns discount bands.
for brow in range(4, -1, -1):  # => tall baskets at the top
    line = ""  # => one grid row being built
    for bcol in range(5):  # => small discounts on the left
        hits = sum(
            1
            for d, b in zip(discount, basket)  # => count points in this cell
            if d // 5 == bcol and (b - 1) // 2 == brow
        )  # => cell membership test
        line += "* " if hits else ". "  # => star for occupied, dot for empty
    print(line.rstrip())  # => Output draws the grid row, no trailing spaces
# => The number behind the cloud, with its limit attached.
print(
    "correlation:", round(statistics.correlation(discount, basket), 4)
)  # => Output reads high
print("caveat: slope shows togetherness, not cause.")  # => Output refuses the leap
