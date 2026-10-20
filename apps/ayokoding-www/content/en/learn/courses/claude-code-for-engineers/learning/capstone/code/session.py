# => Capstone: drive the fixture shim through add, fix, and test.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => One deterministic session: feature, bug fix, and its test end to end.
# => Real behaviour may differ; confirm with claude --help.
FEATURE = "reject wrong passwords"  # => the feature this session adds
BUG = "off-by-one in attempts"  # => the bug this session fixes
TRACE = []  # => the session trace collects here, in order


def step(trace, kind, detail):  # => append one trace line, return it
    line = kind + ": " + detail  # => KIND: detail is the trace format
    trace.append(line)  # => the trace grows in call order
    return line  # => the new line comes back for printing


def plan(trace):  # => the plan-then-act proposal for this session
    step(trace, "plan", "read login.py")  # => step one reads first
    step(trace, "plan", "add check")  # => step two adds the feature
    step(trace, "plan", "fix attempts")  # => step three fixes the bug
    return "approved"  # => the human approves the written plan


def act(trace):  # => execute the approved plan as diff lines
    step(trace, "read", "login.py")  # => reads precede writes
    step(trace, "edit", "login.py +check")  # => the feature lands
    step(trace, "edit", "login.py attempts fix")  # => the bug fix lands
    step(trace, "exec", "pytest -q -> pass")  # => the test gate proves it
    return "green"  # => the suite passes on this run


def judge(trace):  # => the maker corrects two things in this trace
    fixes = [
        "narrowed scope to login.py",
        "demanded red before green",
    ]  # => the two corrections
    step(trace, "judge", fixes[0])  # => correction one enters the trace
    step(trace, "judge", fixes[1])  # => correction two enters the trace
    return fixes  # => both corrections come back as a list


def main():  # => run the whole session: plan, act, judge
    print("plan:", plan(TRACE))  # => Output: plan: approved
    print("act:", act(TRACE))  # => Output: act: green
    fixes = judge(TRACE)  # => two maker corrections recorded
    print("corrections:", len(fixes))  # => Output: corrections: 2
    print("trace lines:", len(TRACE))  # => Output: trace lines: 9
    for line in TRACE:  # => print the full golden trace
        print(" |", line)  # => Output: the nine trace lines in order


main()  # => run once; this printed trace is the golden record
