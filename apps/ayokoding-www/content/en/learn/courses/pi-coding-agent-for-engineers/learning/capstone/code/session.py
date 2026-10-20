# Capstone: drive the Pi fixture shim end to end.
# => Target release 1.3.0, checked against vendor docs on 2026-10-20.
# => One deterministic session: feature, bug fix, and its test.
# => No network, no key, no billing; simplifications stated below.
# => The shim stands in for pi, not for the live product's promises.
# => FEATURE names the capability this session adds.
FEATURE = "reject wrong passwords"  # => the feature this session adds
# => BUG names the defect this session fixes alongside it.
BUG = "off-by-one in attempts"  # => the bug this session fixes
# => TRACE collects every step oldest-first for the golden record.
TRACE = []  # => the session trace collects here, in order


# => step appends one KIND: detail line and returns it for printing.
def step(trace, kind, detail):  # => append one trace line, return it
    # => KIND: detail is the trace format the overview quotes.
    line = kind + ": " + detail  # => KIND: detail is the trace format
    # => The trace grows in call order, never reordered later.
    trace.append(line)  # => the trace grows in call order
    # => The new line comes back so callers can print it directly.
    return line  # => the new line comes back for printing


# => plan proposes read, feature, and fix before anything changes.
def plan(trace):  # => the plan-then-act proposal for this session
    # => Step one reads first: observation precedes modification.
    step(trace, "plan", "read login.py")  # => step one reads first
    # => Step two adds the password rejection feature.
    step(trace, "plan", "add check")  # => step two adds the feature
    # => Step three fixes the attempts counter boundary.
    step(trace, "plan", "fix attempts")  # => step three fixes the bug
    # => The human approves the written plan before the act phase.
    return "approved"  # => the human approves the written plan


# => act executes the approved plan as frozen diff lines.
def act(trace):  # => execute the approved plan as diff lines
    # => Reads precede writes in every sound trace.
    step(trace, "read", "login.py")  # => reads precede writes
    # => The feature lands as one edit line.
    step(trace, "edit", "login.py +check")  # => the feature lands
    # => The bug fix lands as the second edit line.
    step(trace, "edit", "login.py attempts fix")  # => the bug fix lands
    # => The test gate proves the change with a run, not a claim.
    step(trace, "exec", "pytest -q -> pass")  # => the test gate proves it
    # => Green here means the frozen suite passed on this run.
    return "green"  # => the suite passes on this run


# => judge records the two corrections the maker had to make.
def judge(trace):  # => the maker corrects two things in this trace
    # => The first draft scoped too wide and skipped the red run.
    fixes = [
        "narrowed scope to login.py",
        "demanded red before green",
    ]  # => the two corrections
    # => Correction one enters the trace as a judge line.
    step(trace, "judge", fixes[0])  # => correction one enters the trace
    # => Correction two enters the trace the same way.
    step(trace, "judge", fixes[1])  # => correction two enters the trace
    # => Both corrections come back as a list for counting.
    return fixes  # => both corrections come back as a list


# => main runs the whole session: plan, act, judge, then print.
def main():  # => run the whole session: plan, act, judge
    # => The plan line proves approval happened before acting.
    print("plan:", plan(TRACE))  # => Output: plan: approved
    # => The act line proves the suite went green.
    print("act:", act(TRACE))  # => Output: act: green
    # => Two maker corrections are recorded, not silently applied.
    fixes = judge(TRACE)  # => two maker corrections recorded
    # => The count line makes the corrections greppable.
    print("corrections:", len(fixes))  # => Output: corrections: 2
    # => Nine trace lines is the golden shape of this session.
    print("trace lines:", len(TRACE))  # => Output: trace lines: 9
    # => Print the full golden trace oldest-first.
    for line in TRACE:  # => print the full golden trace
        # => Each line prints with a pipe so logs stay parseable.
        print(" |", line)  # => Output: the nine trace lines in order


# => Run once; this printed trace is the golden record.
main()  # => run once; this printed trace is the golden record
