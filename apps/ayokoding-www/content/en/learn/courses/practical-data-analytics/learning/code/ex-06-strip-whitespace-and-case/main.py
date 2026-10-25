# Worked Example 6: Whitespace and Case Cleanup
# => Sinar Abadi and its sales file are fictional; every row is fixed.
# => Six spellings hide two products behind spaces and capitals.
# => Strip whitespace and fold case before any comparison happens.
import csv

# => Open the committed fixture that ships with this example.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Normalize each product name the same single way, every time.
clean = [row["product"].strip().lower() for row in rows]  # => spaces off, case folded
# => Sorted distinct names show what the groups will actually be.
print("distinct:", sorted(set(clean)))  # => Output shows the two survivors
# => Count them: the number Theme D will aggregate over.
print("n_products:", len(set(clean)))  # => Output reads 2, not 6
