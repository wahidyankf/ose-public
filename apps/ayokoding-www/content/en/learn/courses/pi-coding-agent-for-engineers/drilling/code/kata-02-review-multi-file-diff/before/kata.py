# Kata starter: total the diff and record a verdict.
# => CHANGES freezes the proposed diff per file.
CHANGES = [  # => the frozen proposal
    ("src/cart/coupon.py", 22, 0),  # => first file
    ("tests/test_coupon.py", 11, 0),  # => second file
]  # => read every entry before deciding anything
# => TODO: total added and removed lines below.
# => TODO: set verdict to approve, revise, or reject.
verdict = ""  # => TODO: record the review
# => An empty verdict means the review has not happened yet.
# => Print the file count so the review starts somewhere.
print("files:", len(CHANGES))  # => Output counts files
