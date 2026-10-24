# => Kata reference: score three fingerprints, name the winner.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The trace is fixed data; nothing is diagnosed for real.

# => WHY arithmetic first: scores separate before insight arrives.
# => Matching pairs signal loops without listening to excuses.
# => Unanswered failures point at feedback, not effort.
# => Distinct targets reveal drift across the repo.
# => Treat the winner; symptoms mislead.
# => The motion transfers to traces of any length.

TRACE = ["edit a.py", "test FAIL", "edit b.py", "test FAIL"]  # => four trace lines


def fingerprints(trace):  # => score repeats, drift, and ignored errors
    repeats = sum(
        1 for i in range(1, len(trace)) if trace[i] == trace[i - 2]
    )  # => matching pairs
    ignored = sum(1 for t in trace if "FAIL" in t)  # => failures nobody answered
    drift = len(
        {t.split()[1] for t in trace if " " in t}
    )  # => distinct targets touched
    return {
        "repeat": repeats,
        "ignored": ignored,
        "drift": drift,
    }  # => the three scores


def diagnose(trace):  # => the top fingerprint names the failure mode
    return max(fingerprints(trace), key=fingerprints(trace).get)  # => repeat wins here


def main():  # => diagnose the four-line trace once
    print("marks:", fingerprints(TRACE))  # => Output: marks: the three scores
    print("mode:", diagnose(TRACE))  # => Output: mode: repeat


main()  # => run once; compare your starter against this diagnosis
