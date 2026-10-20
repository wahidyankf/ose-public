# => Fixture shim of the plan-then-act gate.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Plans are fixed data; no file is written here.
# => Real behaviour may differ; confirm with claude --help.
PLAN = ["read login.py", "add check", "run tests"]  # => three proposed steps


def propose(steps):  # => render a plan without executing anything
    return [
        "STEP %d: %s" % (i + 1, s) for i, s in enumerate(steps)
    ]  # => numbered, inert lines


def execute(plan_lines, approved):  # => run only when approval is explicit
    if not approved:  # => anything but True stops here
        return ["held: waiting for approval"]  # => the safe default is doing nothing
    return ["ran %d steps" % len(plan_lines)]  # => approval unlocks execution


def main():  # => show the held path and the approved path
    lines = propose(PLAN)  # => three numbered step lines
    print(lines[0])  # => Output: STEP 1: read login.py
    print(execute(lines, False))  # => Output: ['held: waiting for approval']
    print(execute(lines, True))  # => Output: ['ran 3 steps']


main()  # => run once; execution without approval never happens
