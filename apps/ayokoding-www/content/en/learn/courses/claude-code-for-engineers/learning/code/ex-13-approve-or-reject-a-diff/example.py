# => Fixture shim of a diff approval gate.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Decisions are fixed data; no merge happens here.
# => Real behaviour may differ; confirm with claude --help.
CLEAN = {"file": "login.py", "tests": "pass"}  # => a diff with green tests
RISKY = {"file": "schema.sql", "tests": "pass"}  # => green tests, forbidden file


def decide(diff, forbidden):  # => approve or reject with a reason
    if diff["file"] in forbidden:  # => forbidden files reject regardless of tests
        return ("reject", "out of scope")  # => scope beats green tests
    if diff["tests"] != "pass":  # => red tests reject regardless of beauty
        return ("reject", "tests red")  # => the suite is the floor
    return ("approve", "in scope, tests green")  # => both bars cleared


def main():  # => run the gate on a clean and a risky diff
    print(
        decide(CLEAN, ["schema.sql"])
    )  # => Output: ('approve', 'in scope, tests green')
    print(decide(RISKY, ["schema.sql"]))  # => Output: ('reject', 'out of scope')


main()  # => run once; every verdict carries its reason
