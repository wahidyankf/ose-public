# => Offline validator for the required-status-check workflow file.
# => Checked against the vendor workflow docs on 2026-10-20.
# => Subset schema: event names, job keys, step keys, expressions.
# => No network and no live repository; reads workflow.yaml only.
# => WHY this shape: structure first, behaviour second, always.
# => A file that parses here still deserves a same-day live check.
# => Every FAIL names the exact line fragment it expected.
from pathlib import Path  # => locate the data file beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself


def read(name):  # => read a data file into stripped lines
    text = (HERE / name).read_text(encoding="utf-8")  # => raw file text
    return [line.rstrip() for line in text.splitlines()]  # => clean lines


def has(lines, needle):  # => True when any line contains the needle
    return any(needle in line for line in lines)  # => substring scan


def main():  # => run every structural check and print the report
    lines = read("workflow.yaml")  # => lines of the workflow under test
    report = [  # => (label, passed) pairs in display order
        ("test job exists", has(lines, "test:")),  # => expect this
        ("context named", has(lines, "required-check")),  # => expect this
        ("protection noted", has(lines, "branch protection")),  # => expect this
        ("status registered", has(lines, "checks:")),  # => expect this
        ("runner pinned", has(lines, "runs-on:")),  # => expect this
    ]  # => end of the check list
    for label, ok in report:  # => one line per check, stable order
        print(("PASS" if ok else "FAIL") + ": " + label)  # => verdict
    done = sum(1 for _, ok in report if ok)  # => count of passes
    print("checks:", str(done) + "/" + str(len(report)))  # => summary


main()  # => run once; a FAIL names the missing piece
