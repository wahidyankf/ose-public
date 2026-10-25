# => Fixture shim fixing the shared comparison task.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The task is fixed data; no agent attempts it here.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
TASK = {"scope": "login.py", "done": "pytest -q exits 0"}  # => the one shared task


def identical(a, b):  # => both agents must receive byte-identical briefs
    return a == b  # => True only when scope and done match exactly


def describe(task):  # => render the shared task as one line
    return "%s | %s" % (task["scope"], task["done"])  # => scope plus proof


def main():  # => fix the task and confirm both sides match
    print("task:", describe(TASK))  # => Output: task: login.py | pytest -q exits 0
    print("identical:", identical(TASK, dict(TASK)))  # => Output: identical: True


main()  # => run once; one task, two agents, no excuses
