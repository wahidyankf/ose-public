# => Fixture shim recording and correcting a wrong assumption.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Assumptions are fixed data; nothing is re-decided for real.
# => Real behaviour may differ; confirm with claude --help.
ASSUMED = {"db": "postgres", "auth": "token"}  # => two recorded beliefs


def correct(assumed, key, value):  # => replace one named assumption
    fixed = dict(assumed)  # => copy so history stays readable
    fixed[key] = value  # => the correction lands on the named key
    return fixed  # => the repaired belief set


def poisoned(assumed, key):  # => decisions resting on the wrong belief
    return (
        ["migration plan"] if assumed[key] == "postgres" else []
    )  # => the dependent decision


def main():  # => correct the db belief and show the fallout
    print(
        "poisoned:", poisoned(ASSUMED, "db")
    )  # => Output: poisoned: ['migration plan']
    fixed = correct(ASSUMED, "db", "sqlite")  # => the correction applied
    print("fixed db:", fixed["db"])  # => Output: fixed db: sqlite
    print("poisoned now:", poisoned(fixed, "db"))  # => Output: poisoned now: []


main()  # => run once; correct beliefs, then replay dependents
