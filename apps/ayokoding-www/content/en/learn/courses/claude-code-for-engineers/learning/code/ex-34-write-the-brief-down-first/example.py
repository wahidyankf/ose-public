# => Fixture shim rendering a brief as a stable document.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The document is fixed data; no file is written here.
# => Real behaviour may differ; confirm with claude --help.
BRIEF = {
    "scope": "login.py",
    "done": "pytest -q exits 0",
}  # => scope plus checkable done
GUARD = "no schema change"  # => the one no-go rule for this task


def render(brief, guard):  # => render the brief as three document lines
    lines = ["scope: " + brief["scope"]]  # => line one names the files
    lines.append("done: " + brief["done"])  # => line two names the proof
    lines.append("guard: " + guard)  # => line three names the limit
    return lines  # => the written brief as a list


def complete(lines):  # => a brief is complete with all three lines present
    return len(lines) == 3  # => three lines means nothing was forgotten


def main():  # => render the brief and confirm it is complete
    lines = render(BRIEF, GUARD)  # => three document lines
    for line in lines:  # => print each line of the written brief
        print(line)  # => Output: scope, done, and guard lines
    print("complete:", complete(lines))  # => Output: complete: True


main()  # => run once; written briefs outlive spoken ones
