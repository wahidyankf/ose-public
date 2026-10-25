# => Fixture shim expanding slash commands into steps.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Commands are fixed data; no workflow runs here.
# => Real behaviour may differ; confirm with claude --help.
COMMANDS = {"/review": ["diff", "tests", "verdict"]}  # => one command, three steps


def expand(commands, name):  # => expand one command name into its steps
    return list(commands.get(name, []))  # => unknown names expand to nothing


def known(commands):  # => list every registered command name
    return sorted(commands)  # => sorted names keep listings stable


def main():  # => expand the review command and list the registry
    print(
        "steps:", expand(COMMANDS, "/review")
    )  # => Output: steps: the three workflow steps
    print("known:", known(COMMANDS))  # => Output: known: ['/review']
    print("unknown:", expand(COMMANDS, "/nope"))  # => Output: unknown: []


main()  # => run once; name workflows worth repeating
