# => Example 23: format specs declare each column layout.
rows = [("ada", 98.5), ("grace", 100.0), ("margaret", 87.25)]  # => name plus score rows
for name, score in rows:  # => one report line per row
    print(f"{name:<10} {score:6.2f}")  # => WHY specs: width plus precision declared
rate = 0.9375  # => a raw ratio needing percent display
print(f"success: {rate:.1%}")  # => Output: success: 93.8%, spec formats it
big = 1234567  # => a count needing grouped digits
print(f"total: {big:,}")  # => Output: total: 1,234,567, separator declared
