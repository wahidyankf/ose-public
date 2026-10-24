# => Fixture shim detecting and reverting an out-of-scope edit.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Edits are fixed data; nothing is reverted for real.
# => Real behaviour may differ; confirm with claude --help.
SCOPE = ["login.py"]  # => the brief allows exactly one file
EDITS = ["login.py", "settings.py"]  # => the agent touched two


def intruders(edits, scope):  # => edits outside the brief's scope
    return [e for e in edits if e not in scope]  # => settings.py intruded


def revert(intruders):  # => revert each intruding edit with a note
    return ["reverted " + e for e in intruders]  # => one revert line each


def restate(scope):  # => restate the scope for the retry
    return "scope is: " + ", ".join(scope)  # => the retry brief in one line


def main():  # => detect, revert, and restate
    bad = intruders(EDITS, SCOPE)  # => settings.py stands out
    print("intruders:", bad)  # => Output: intruders: ['settings.py']
    print(revert(bad)[0])  # => Output: reverted settings.py
    print(restate(SCOPE))  # => Output: scope is: login.py


main()  # => run once; revert first, restate second, retry third
