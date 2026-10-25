# => Six fixture log lines; only errors deserve attention.
# => Level is always the first token.
lines = ["INFO gateway up", "INFO session ses-001 open", "ERROR provider timeout", "INFO retry 1", "ERROR queue full", "INFO retry 2"]  # => fixture log, newest last
# => lines has 6 entries (type: list)
print("total lines: %d" % len(lines))  # => Output: total lines: 6
errors = [l for l in lines if l.startswith("ERROR")]  # => keep only lines at ERROR level
# => errors has 2 entries (type: list)
for line in errors:  # => read the errors, oldest first
    print("found: " + line)  # => Output: found: ERROR provider timeout, then ERROR queue full
print("errors: %d" % len(errors))  # => Output: errors: 2
print("routine hidden: %d" % (len(lines) - len(errors)))  # => Output: routine hidden: 4
