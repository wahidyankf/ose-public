# => Eight fixture lines across four levels.
# => Each level answers its own question.
lines = ["ERROR crash loop", "WARN slow provider", "INFO session open", "DEBUG retry payload", "ERROR queue full", "WARN token spike", "INFO session close", "DEBUG cache miss"]  # => two fixture lines per level
# => lines has 8 entries (type: list)
levels = ["ERROR", "WARN", "INFO", "DEBUG"]  # => severity order, gravest first
for level in levels:  # => report each level in severity order
    hits = [l for l in lines if l.startswith(level)]  # => collect this level's lines
    # => two hits per level
    print(level + ": %d lines" % len(hits))  # => Output: four level-count lines
print("crash signal: ERROR")  # => crashes announce at ERROR
print("slowdown signal: WARN")  # => slowdowns whisper at WARN first
