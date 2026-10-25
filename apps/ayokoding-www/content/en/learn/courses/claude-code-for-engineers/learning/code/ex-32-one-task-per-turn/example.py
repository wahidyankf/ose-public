# => Fixture shim splitting compound prompts into single tasks.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Tasks are fixed data; nothing is delegated here.
# => Real behaviour may differ; confirm with claude --help.
COMPOUND = "fix login, refactor auth, update docs"  # => three jobs in one breath


def split_tasks(compound):  # => break one breath into separate tasks
    return [t.strip() for t in compound.split(",")]  # => three clean task strings


def sequence(tasks):  # => number tasks so order is explicit
    return ["%d. %s" % (i + 1, t) for i, t in enumerate(tasks)]  # => 1-2-3 with names


def main():  # => split the compound prompt and number the pieces
    tasks = split_tasks(COMPOUND)  # => three separate task strings
    print("tasks:", len(tasks))  # => Output: tasks: 3
    for line in sequence(tasks):  # => print each numbered task
        print(line)  # => Output: 1. fix login, then 2 and 3


main()  # => run once; sequence compound prompts before sending
