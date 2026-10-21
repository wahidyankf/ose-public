# Worked Example 48: Assembling the One-Page Report
# => Sinar Abadi and its restock verdict are fictional; every word is fixed.
# => Four sections in order: the shape of every honest page.
# => The order is the argument: aim, proof, numbers, bounds.
# => The four sections, each reduced to its load-bearing line.
report = [
    "Q: restock staples for October if mean September basket exceeds 3?",  # => the aim
    "M: sales-sep.csv, strip+lower, median-fill, product x month.",  # => the proof path
    "F: rice averages 3.0 units (stdev 0.82, n=4); sugar 4.0 (n=3).",  # => the numbers
    "C: n=4, Saturday-only, payday confound, no causal claim.",
]  # => the bounds
# => Print the page in argument order, then sign the verdict.
for line in report:  # => question, method, finding, caveats
    print(line)  # => Output prints each section line
print(
    "verdict: restock rice; hold sugar pending weekday data."
)  # => Output signs narrowly
