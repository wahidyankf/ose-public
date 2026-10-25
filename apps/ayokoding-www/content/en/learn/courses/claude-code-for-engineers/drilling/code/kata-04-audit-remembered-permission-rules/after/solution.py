# => Kata reference: audit remembered rules, flag the overbroad one.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Rules are fixed data; nothing is permitted here.

# => WHY flag breadth: wildcards grant futures nobody reviewed.
# => Deletion commands never earn standing approval.

RULES = [
    "allow exec: npm test",
    "allow edit: /repo/**",
    "allow exec: rm *",
]  # => three rules


def risky(rule):  # => a rule is risky when it names wildcards or removal
    return "*" in rule or rule.startswith("allow edit: /")  # => breadth or deletion


def audit(rules):  # => flag risky rules, keep the tight ones
    return [(r, risky(r)) for r in rules]  # => one pair per rule


def main():  # => audit three remembered rules
    for rule, flag in audit(RULES):  # => walk each rule with its flag
        print(flag, rule)  # => Output: False/True beside each rule


main()  # => run once; compare your starter against this audit
