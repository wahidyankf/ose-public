# Worked Example 41: Survivorship Bias in Returns
# => Sinar Abadi, its sales, and its returns are fictional and fixed.
# => Three unhappy buyers left; the kept average never met them.
# => Kept-only versus everything-sold: the gap is the bias.
import csv
import statistics

# => Ratings of goods the buyers kept, from the committed fixture.
with open(
    "sales.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    kept = [int(r["rating"]) for r in csv.DictReader(handle)]  # => seven happy buyers
# => Ratings attached to returned goods, from the committed fixture.
with open(
    "returns.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    sent_back = [
        int(r["rating"]) for r in csv.DictReader(handle)
    ]  # => three unhappy ones
# => The rosy number the dashboard quotes without thinking.
print("kept_only:", round(statistics.mean(kept), 2))  # => Output reads 4.57
# => The honest number across every unit that left the store.
print("all_sold:", round(statistics.mean(kept + sent_back), 2))  # => Output reads 3.8
# => Three of ten sales came back: the dropout rate behind the gap.
print(
    "returned:", len(sent_back), "of", len(kept) + len(sent_back)
)  # => Output reads 3 of 10
