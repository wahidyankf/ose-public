# Worked Example 7: Coercing Number-Like Text
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Prices wear commas, currency tags, and one hopeless n/a.
# => Strip the decorations, convert strictly, park failures as None.
import csv


# => Turn one raw price cell into a number or an explicit None.
def coerce(raw):  # => single policy for the whole column
    text = raw.strip().lower()  # => trim, then fold for the k-suffix
    text = text.replace("rp", "").replace(",", "")  # => drop currency and separators
    if text.endswith("k"):  # => thousands shorthand stays supported
        text = text[:-1]  # => cut the suffix letter
        try:  # => convert the digits before it
            return float(text) * 1000  # => scale back up
        except ValueError:  # => digits were not digits
            return None  # => park the failure openly
    try:  # => plain-number path
        return float(text)  # => strict judge of what remains
    except ValueError:  # => n/a and friends land here
        return None  # => unknown, never zero


# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Coerce the whole column through the one policy.
parsed = [coerce(row["price"]) for row in rows]  # => numbers and Nones
# => Show the parked failures first so nobody mistakes them for sales.
print("parsed:", parsed)  # => Output shows four numbers and one None
# => Total only the cells that genuinely converted.
print("total:", int(sum(v for v in parsed if v is not None)))  # => Output reads 193000
