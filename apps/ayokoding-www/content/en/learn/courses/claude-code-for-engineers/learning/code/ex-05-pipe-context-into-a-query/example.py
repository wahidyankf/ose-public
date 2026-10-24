# => Fixture shim of piped input into print mode.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => stdin is a fixed string here so the run stays deterministic.
# => Real behaviour may differ; confirm with claude --help.
PIPED = (
    "ERROR disk full\nINFO retry 1\nERROR disk full"  # => three log lines via the pipe
)
QUESTION = "why did the job fail"  # => the question the piped text must answer


def first_error(log):  # => pull the earliest failure line from the pipe
    errors = [
        l for l in log.split("\n") if l.startswith("ERROR")
    ]  # => keep the two ERROR lines
    return errors[0] if errors else "no error"  # => earliest failure wins


def ask(piped, question):  # => join piped context with the question
    cause = first_error(piped)  # => cause names the disk-full line
    lines = len(piped.split("\n"))  # => lines is 3 for this excerpt
    return "%s: %s (%d lines read)" % (question, cause, lines)  # => one grounded reply


def main():  # => simulate the pipe and print the grounded answer
    print(ask(PIPED, QUESTION))  # => Output: the question plus the first ERROR line


main()  # => run once; same bytes in always means same answer out
