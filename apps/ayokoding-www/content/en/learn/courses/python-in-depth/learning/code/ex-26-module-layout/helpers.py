# => Example 26 helper module: definitions only, zero actions.
def format_report(name, score):  # => one public function: the module job
    return f"{name}: {score}"  # => WHY pure: no I/O, trivially testable


PASS_MARK = 60  # => WHY constant: the threshold named once at top


def passed(score):  # => a second helper sharing the module
    return score >= PASS_MARK  # => rule uses the constant, not a literal
