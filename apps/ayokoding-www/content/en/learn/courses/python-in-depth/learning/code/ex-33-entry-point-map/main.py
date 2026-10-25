# => Example 33 driver: the entry function used directly.
import reporter  # => WHY import: entry logic tested without installing

print(reporter.main(["reporter"]))  # => Output: 2 rows, default verb ran
print(reporter.main(["reporter", "check"]))  # => Output: ok, named verb ran
print(sorted(reporter.VERBS))  # => Output: ['check', 'summary'], surface listed
