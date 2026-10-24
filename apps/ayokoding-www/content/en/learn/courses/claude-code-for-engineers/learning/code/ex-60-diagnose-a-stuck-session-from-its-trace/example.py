# => Fixture shim scoring stuck-session fingerprints in a trace.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The trace is fixed data; nothing is diagnosed for real.
# => Real behaviour may differ; confirm with claude --help.

# => WHY three fingerprints: loops, drift, and ignored errors cover the common stuck modes.
# => Each mode has its own cure, so naming matters.
# => Loops need interrupts, drift needs rescoping.
# => Ignored errors need verbatim feedback, not retries.
# => Scoring beats mood-reading for stuck sessions.
# => Two-point leads decide; ties mean watch one more turn.
# => Fixed data keeps the demonstration deterministic.
# => The scoring motion transfers to live traces unchanged.
# => Diagnose in writing before intervening.
# => The trace already contains the answer.

TRACE = [
    "edit a.py",
    "test FAIL",
    "edit a.py",
    "test FAIL",
]  # => repeat plus ignored failure


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


def dominant(marks):  # => the highest-scoring fingerprint names the mode
    return max(marks, key=marks.get)  # => repeat wins this trace


def main():  # => score the trace and name its failure mode
    marks = fingerprints(TRACE)  # => repeat 3, ignored 2, drift 2
    print("marks:", marks)  # => Output: marks: the three scores
    print("mode:", dominant(marks))  # => Output: mode: repeat


main()  # => run once; diagnose from the trace, not the mood
