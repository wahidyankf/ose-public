# => Example 4: zip steps paired collections in lockstep.
names = ["ada", "grace"]  # => first column of the logical table
scores = [98, 100]  # => second column: aligned by position
for name, score in zip(names, scores):  # => WHY zip: one row per step
    print(name, score)  # => Output: ada 98 / grace 100, paired
paired = list(zip(names, scores))  # => rows materialized for inspection
print(paired)  # => Output: [('ada', 98), ('grace', 100)]
extra = ["ada", "grace", "margaret"]  # => ragged input: longer than scores
try:  # => WHY try: strict raises, and the lesson pins the message
    for name, score in zip(extra, scores, strict=True):  # => lengths must align
        print(name, score)  # => never runs: strict raises first
except ValueError:  # => the contract violation, caught for the transcript
    print("strict: length mismatch")  # => Output: strict: length mismatch
