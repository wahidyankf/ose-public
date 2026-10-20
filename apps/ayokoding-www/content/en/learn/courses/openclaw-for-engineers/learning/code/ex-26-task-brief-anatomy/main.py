# => Four brief parts, assembled and completeness-checked.
# => Each part is one plain string.
brief = {}  # => the brief starts empty
brief["goal"] = "archive drafts older than 30 days"  # => what the agent must achieve
# => goal is the first part
brief["scope"] = "drafts/ only"  # => the files the agent may touch
# => scope is the second part
brief["done"] = "archive/ holds the moved files"  # => the observable finish line
# => done is the third part
brief["guardrails"] = "never delete before copying"  # => the line the agent must not cross
# => guardrails are the fourth part
parts = ["goal", "scope", "done", "guardrails"]  # => the four required brief parts
missing = [p for p in parts if p not in brief]  # => list any part the brief forgot
# => missing is [] for this full brief
print("parts: %d of %d" % (len(brief), len(parts)))  # => Output: parts: 4 of 4
for p in parts:  # => show the brief in canonical order
    print(p + ": " + brief[p])  # => Output: four part lines
print("sendable: " + str(len(missing) == 0))  # => Output: sendable: True
