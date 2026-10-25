# => Fixture shim of a tagged tool-use trace.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Tags are fixed data; no agent runs here.
# => Real behaviour may differ; confirm with claude --help.
TRACE = [
    ("plan", "draft login flow"),
    ("read", "login.py"),
    ("plan", "add test"),
]  # => three tagged steps


def is_action(kind):  # => decide if a step kind changes anything
    return kind in ("read", "edit", "exec")  # => reads count: they touch the repo


def split_trace(trace):  # => separate talk from deeds, in order
    plans = [w for k, w in trace if not is_action(k)]  # => two plan lines here
    acts = [w for k, w in trace if is_action(k)]  # => one action line here
    return plans, acts  # => both lists keep original order


def main():  # => print each side of the trace once
    plans, acts = split_trace(TRACE)  # => plans has 2, acts has 1
    print("plans:", len(plans))  # => Output: plans: 2
    print("actions:", len(acts))  # => Output: actions: 1
    print("first action:", acts[0])  # => Output: first action: login.py


main()  # => run once; untagged steps would break the split
