# Worked Example 42: Sampling Bias, Who Was Asked
# => Sinar Abadi, its survey, and its week are fictional and fixed.
# => Saturday bargain hunters over-answer; weekday regulars stay silent.
# => Share in the survey divided by share in the week measures distortion.
import csv


# => Share of each product inside a file of product-choice rows.
def shares(path):  # => one mixer for both files
    with open(path, newline="", encoding="utf-8") as handle:  # => fixed text settings
        rows = list(csv.DictReader(handle))  # => header becomes the keys
    counts = {}  # => product to count
    for row in rows:  # => visit each response once
        counts[row["product"]] = (
            counts.get(row["product"], 0) + 1
        )  # => tally the choice
    return {p: c / len(rows) for p, c in counts.items()}  # => counts become shares


# => The Saturday-morning survey mix and the full-week sales mix.
survey = shares("survey.csv")  # => ten bargain-hunter responses
week = shares("week.csv")  # => ten receipts across the week
# => Over-representation of the promo shelf: survey share over true share.
print("sugar_survey:", round(survey["sugar-1kg"], 2))  # => Output reads 0.6
print("sugar_week:", round(week["sugar-1kg"], 2))  # => Output reads 0.3
print(
    "over_rep:", round(survey["sugar-1kg"] / week["sugar-1kg"], 1)
)  # => Output reads 2.0
