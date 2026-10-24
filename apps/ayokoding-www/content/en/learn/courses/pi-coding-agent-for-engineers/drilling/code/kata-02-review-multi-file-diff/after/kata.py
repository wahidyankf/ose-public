# Kata 2: Review a Multi File Diff
# => Review multi-file changes as one unit, never file by file.
# => Logic without its test alongside is only half a change.
# => Totals turn the proposal into one reviewable number.
CHANGES = [  # => the frozen proposal
    ("src/cart/coupon.py", 22, 0),  # => logic change
    ("tests/test_coupon.py", 11, 0),  # => proof riding along
]  # => read every entry before deciding anything
# => Totals turn a file list into one reviewable number.
# => Added and removed lines get equal scrutiny.
added = sum(c[1] for c in CHANGES)  # => added lines total
# => Deletions matter as much: removed code can hide bugs.
removed = sum(c[2] for c in CHANGES)  # => removed total
# => The verdict follows the brief's rule, not a feeling.
# => Small totals with tests along earn fast approvals.
verdict = "approve"  # => tests ride along, nothing removed
# => Print files touched, lines, and the verdict.
print("files:", len(CHANGES))  # => Output counts files
print("added:", added, "removed:", removed)  # => Output lines
print("verdict:", verdict)  # => Output records the review
