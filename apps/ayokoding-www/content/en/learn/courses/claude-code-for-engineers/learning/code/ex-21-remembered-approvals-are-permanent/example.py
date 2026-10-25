# => Fixture shim of remembered approval rules in local settings.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The settings file is modeled in memory; nothing is written.
# => Real behaviour may differ; confirm with claude --help.
SETTINGS = ".claude/settings.local.json"  # => remembered rules live here


def remember(rules, command):  # => add one remembered rule for a command
    rule = "allow exec: " + command  # => the rule names tool and command
    return rules + [rule]  # => a new list, the old one untouched


def audit(rules):  # => render every remembered rule for review
    return ["%d. %s" % (i + 1, r) for i, r in enumerate(rules)]  # => numbered lines


def main():  # => remember twice, then audit the file
    rules = []  # => an empty settings file to start
    rules = remember(rules, "npm test")  # => first remembered rule added
    rules = remember(rules, "git status")  # => second remembered rule added
    print("file:", SETTINGS)  # => Output: file: .claude/settings.local.json
    print("rules:", len(rules))  # => Output: rules: 2
    print(audit(rules)[0])  # => Output: 1. allow exec: npm test


main()  # => run once; audit remembered rules like dependencies
