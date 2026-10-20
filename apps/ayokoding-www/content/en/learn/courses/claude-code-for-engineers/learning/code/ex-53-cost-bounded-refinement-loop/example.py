# => Fixture shim of fix-and-test cycles under an attempt cap.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Outcomes are fixed data; no code is fixed here.
# => Real behaviour may differ; confirm with claude --help.
OUTCOMES = ["fail", "fail", "pass"]  # => green arrives on the third try
CAP = 5  # => five attempts maximum, agreed up front


def refine(outcomes, cap):  # => walk outcomes until pass or cap
    tried = 0  # => attempts consumed so far
    for outcome in outcomes[:cap]:  # => never look past the cap
        tried += 1  # => each outcome costs one attempt
        if outcome == "pass":  # => green ends the loop early
            return "green", tried  # => success plus its price
    return "capped", tried  # => honesty when the cap wins


def main():  # => refine three outcomes under a cap of five
    result, tried = refine(OUTCOMES, CAP)  # => green after 3 tries
    print("result:", result)  # => Output: result: green
    print("tried:", tried)  # => Output: tried: 3
    print("cap:", CAP)  # => Output: cap: 5


main()  # => run once; caps convert spirals into reports
