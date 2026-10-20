# => Fixture shim of the three permission-prompt answers.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Answers are fixed data; nothing is really permitted here.
# => Real behaviour may differ; confirm with claude --help.
ANSWERS = ["yes", "yes-remember", "no"]  # => the three honest answers


def apply(answer, memory):  # => record what each answer persists
    if answer == "yes":  # => one-time approval changes nothing durable
        return memory  # => the rule set comes back untouched
    if answer == "yes-remember":  # => remembered approvals persist per repo
        return memory + ["rule saved"]  # => one durable rule is added
    return memory  # => no changes nothing and stops the action


def main():  # => try all three answers from an empty rule set
    memory = []  # => no remembered rules at the start
    print("yes ->", apply("yes", memory))  # => Output: yes -> []
    print(
        "remember ->", apply("yes-remember", memory)
    )  # => Output: remember -> ['rule saved']
    print("no ->", apply("no", memory))  # => Output: no -> []


main()  # => run once; only remember mutates the future
