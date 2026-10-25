# => Example 26 main: thin orchestration over the helper module.
import helpers  # => WHY import: reuse without executing actions

rows = [("ada", 98), ("grace", 55)]  # => input both paths format
for name, score in rows:  # => orchestration: iterate, delegate, print
    print(helpers.format_report(name, score))  # => Output: ada: 98 / grace: 55
print(helpers.passed(98))  # => Output: True, helper reused directly
