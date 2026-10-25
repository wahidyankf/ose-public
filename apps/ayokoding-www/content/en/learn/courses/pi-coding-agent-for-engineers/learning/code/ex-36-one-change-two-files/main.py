# Example 36: One Change Two Files
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => CHANGES freezes the proposed diff per file.
# => Each triple is path, added lines, removed lines.
CHANGES = [  # => the frozen proposal
    ("src/cart/cart.py", 14, 3),  # => src/cart/cart.py
    ("tests/test_cart.py", 9, 1),  # => tests/test_cart.py
]  # => read every entry before deciding anything
# => Totals turn a file list into one reviewable number.
added = sum(c[1] for c in CHANGES)  # => added lines total
# => Deletions matter as much: removed code can hide bugs.
removed = sum(c[2] for c in CHANGES)  # => removed total
# => The verdict follows the brief's rule, not a feeling.
verdict = "approve"  # => approve, reject, or revise
# => Print files touched, lines, and the verdict.
print("files:", len(CHANGES))  # => Output counts files
print("added:", added, "removed:", removed)  # => Output counts lines
print("verdict:", verdict)  # => Output records the review
