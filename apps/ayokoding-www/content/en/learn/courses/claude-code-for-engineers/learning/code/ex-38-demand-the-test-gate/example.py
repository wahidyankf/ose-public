# => Fixture shim gating change acceptance on test results.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Results are fixed data; no suite runs here.
# => Real behaviour may differ; confirm with claude --help.
RESULTS = {"login fix": "pass", "auth tweak": "fail"}  # => one proven, one pending


def gate(results):  # => split changes into proven and pending
    proven = [k for k, v in results.items() if v == "pass"]  # => the passing change
    pending = [k for k, v in results.items() if v != "pass"]  # => the failing change
    return proven, pending  # => both lists by change name


def main():  # => gate two changes on their suite results
    proven, pending = gate(RESULTS)  # => one proven, one pending
    print("proven:", proven)  # => Output: proven: ['login fix']
    print("pending:", pending)  # => Output: pending: ['auth tweak']


main()  # => run once; pending changes never merge
