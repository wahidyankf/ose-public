# => Fixture shim of a read-before-write checker.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Both traces are fixed data; nothing runs here.
# => Real behaviour may differ; confirm with claude --help.
GOOD = ["read a.py", "edit a.py"]  # => the edit follows its read
BAD = ["edit b.py"]  # => the edit arrives with no read first


def check(trace):  # => return the edits that no read precedes
    seen = set()  # => files read so far in this trace
    bad = []  # => edits without a preceding read collect here
    for call in trace:  # => walk the trace once, in order
        kind, name = call.split()  # => split "edit b.py" into kind and file
        if kind == "read":  # => reads only extend the seen set
            seen.add(name)  # => remember this file was read
        elif name not in seen:  # => an unseen file means a blind edit
            bad.append(call)  # => record the offending call
    return bad  # => empty means every edit was informed


def main():  # => check one good trace and one bad trace
    print("good violations:", check(GOOD))  # => Output: good violations: []
    print("bad violations:", check(BAD))  # => Output: bad violations: ['edit b.py']


main()  # => run once; order is the entire check
