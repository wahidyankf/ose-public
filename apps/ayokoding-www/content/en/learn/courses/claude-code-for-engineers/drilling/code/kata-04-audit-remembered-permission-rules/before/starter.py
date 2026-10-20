# => Kata starter: audit the remembered rules below.
# => Run the reference solution to see the target audit.
RULES = [
    "allow exec: npm test",
    "allow edit: /repo/**",
    "allow exec: rm *",
]  # => three rules


def audit(rules):  # => TODO: return flagged rules with reasons
    return []  # => TODO: replace with the real audit
