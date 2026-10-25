# Example 14: List Saved Sessions
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => RECORDS freezes what Pi would report for this op.
# => Each line is one fact the engineer can quote.
RECORDS = [  # => the frozen report lines
    "shop-cart * active",  # => one reported fact
    "shop-auth idle",  # => one reported fact
    "docs-rewrite idle",  # => one reported fact
]  # => order matches Pi's own display order
# => The op name says which command produced this.
op = "/session list"  # => the Pi command under test
# => Print the op first so logs stay attributable.
print("op:", op)  # => Output names the command
# => Then print each record line verbatim.
for line in RECORDS:  # => walk the frozen report
    print("row:", line)  # => Output shows the record
