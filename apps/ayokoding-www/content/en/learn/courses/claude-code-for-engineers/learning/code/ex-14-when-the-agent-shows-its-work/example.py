# => Fixture shim separating thinking lines from doing lines.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The session lines are fixed data; nothing executes.
# => Real behaviour may differ; confirm with claude --help.
LINES = [
    "THINK: login needs a check",
    "CALL: read login.py",
    "THINK: add test",
]  # => mixed output


def doing(lines):  # => keep only the lines that changed or read state
    return [l for l in lines if l.startswith("CALL")]  # => one CALL line here


def thinking(lines):  # => keep only the reasoning lines
    return [l for l in lines if l.startswith("THINK")]  # => two THINK lines here


def main():  # => count each kind and name the doing line
    print("thinking:", len(thinking(LINES)))  # => Output: thinking: 2
    print("doing:", len(doing(LINES)))  # => Output: doing: 1
    print("did:", doing(LINES)[0])  # => Output: did: CALL: read login.py


main()  # => run once; weight CALL lines above THINK lines
