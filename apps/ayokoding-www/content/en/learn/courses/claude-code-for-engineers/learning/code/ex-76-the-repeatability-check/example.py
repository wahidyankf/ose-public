# => Fixture shim replaying a comparison from its record.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Records are fixed data; nothing is replayed for real.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
RECORD = {"task": "login.py", "runs": 2, "verdict": "A"}  # => the written record


def replay(record):  # => recompute the verdict from the record alone
    if record["runs"] < 2:  # => single runs cannot support a verdict
        return "insufficient"  # => honesty about thin evidence
    return record["verdict"]  # => the recorded verdict stands


def matches(record):  # => the replay must equal the published verdict
    return replay(record) == record["verdict"]  # => True when reproducible


def main():  # => replay the record and confirm the verdict
    print("replay:", replay(RECORD))  # => Output: replay: A
    print("reproduced:", matches(RECORD))  # => Output: reproduced: True


main()  # => run once; publish records, not just verdicts
