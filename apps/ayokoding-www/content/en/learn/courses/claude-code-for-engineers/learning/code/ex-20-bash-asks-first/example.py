# => Fixture shim of the shell-command approval gate.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Commands are fixed data; nothing is executed here.
# => Real behaviour may differ; confirm with claude --help.
SAFE = ["ls", "cat", "git status"]  # => built-in read-only set passes silently
COMMANDS = ["ls", "pytest", "rm -rf /tmp/x"]  # => one safe, two asking


def asks(cmd):  # => decide if a shell command prompts first
    return cmd not in SAFE  # => only the built-in set skips the prompt


def gate(commands):  # => split commands into silent and asking
    silent = [c for c in commands if not asks(c)]  # => ls passes through
    gated = [c for c in commands if asks(c)]  # => pytest and rm wait
    return silent, gated  # => both lists keep command order


def main():  # => gate the three commands and report
    silent, gated = gate(COMMANDS)  # => silent has 1, gated has 2
    print("silent:", silent)  # => Output: silent: ['ls']
    print("gated:", gated)  # => Output: gated: ['pytest', 'rm -rf /tmp/x']


main()  # => run once; destructive commands never skip the line
