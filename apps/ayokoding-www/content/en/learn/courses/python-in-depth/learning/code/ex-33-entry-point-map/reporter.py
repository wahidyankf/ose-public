# => Example 33 command module: verbs as functions, dispatch as data.
def summary(rows):  # => one verb: condense rows to a count line
    return f"{len(rows)} rows"  # => WHY pure: verb logic testable alone


def check(rows):  # => second verb: health of the same rows
    return "ok" if rows else "empty"  # => fixed labels for both states


VERBS = {"summary": summary, "check": check}  # => WHY map: dispatch is data


def main(argv):  # => the entry function installers would name
    verb = argv[1] if len(argv) > 1 else "summary"  # => default verb keeps runs simple
    return VERBS[verb](["a", "b"])  # => dispatch by table, not by branch
