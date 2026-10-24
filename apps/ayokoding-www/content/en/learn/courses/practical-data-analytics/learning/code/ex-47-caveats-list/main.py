# Worked Example 47: Listing Caveats and Limits
# => Sinar Abadi and its rice finding are fictional; every word is fixed.
# => Four known limits, labeled by the concept that demands each one.
# => A register, not an apology: scope stated is scope kept.
# => The register: label, limit, and the concept behind it.
caveats = [
    ("small-n (co-14)", "n=4: one new receipt moves the mean"),  # => thin evidence
    ("sampling (co-08)", "Saturday only: weekday buyers unasked"),  # => skewed crowd
    (
        "confounding (co-15)",
        "payday weeks lift baskets regardless",
    ),  # => shared calendar
    ("causation (co-15)", "no lever tested: description, not prescription"),
]  # => refused leap
# => Print the register in full: every limit the analyst knows.
for label, limit in caveats:  # => fixed order, every run
    print(label + ":", limit)  # => Output prints each labeled caveat
print("caveats:", len(caveats))  # => Output reads 4
