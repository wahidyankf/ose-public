# => Vague ask versus four-part rewrite, scored side by side.
# => The gap quantifies the rewrite's value.
parts = ["goal", "scope", "done", "guardrails"]  # => the four-part checklist from Example 26
vague = {"goal": "fix the docs"}  # => the original one-line ask
# => vague carries one part
scoped = {"goal": "fix broken links in docs", "scope": "docs/", "done": "link checker passes", "guardrails": "touch no code"}  # => the rewrite, one line per part
# => scoped carries all four parts
vague_hit = sum(1 for p in parts if p in vague)  # => count vague's covered parts
# => vague_hit is 1
scoped_hit = sum(1 for p in parts if p in scoped)  # => count the rewrite's covered parts
# => scoped_hit is 4
print("vague score: %d of %d" % (vague_hit, len(parts)))  # => Output: vague score: 1 of 4
print("scoped score: %d of %d" % (scoped_hit, len(parts)))  # => Output: scoped score: 4 of 4
print("gap closed: %d" % (scoped_hit - vague_hit))  # => Output: gap closed: 3
