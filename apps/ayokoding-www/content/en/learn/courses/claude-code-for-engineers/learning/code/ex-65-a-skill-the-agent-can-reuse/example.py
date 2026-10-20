# => Fixture shim of a skill registry with task matching.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Skills are fixed data; nothing is loaded here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY task language: requesters trigger, authors do not.
# => Third repetition earns packaging; first hunch does not.
# => One focused skill beats an unopened handbook.
# => Triggers mirror words tasks actually contain.
# => Registry matching stays visible and debuggable.
# => Skills load know-how exactly when it applies.

SKILLS = {
    "review": ["diff", "hunk"],
    "debug": ["trace", "error"],
}  # => trigger words per skill


def match(skills, task):  # => load skills whose triggers appear in the task
    words = task.split()  # => the task's words to match against
    return [
        s for s, keys in skills.items() if any(k in words for k in keys)
    ]  # => matching skills


def main():  # => match two tasks against the registry
    print(
        "review task:", match(SKILLS, "review this diff hunk")
    )  # => Output: review task: ['review']
    print(
        "debug task:", match(SKILLS, "read the error trace")
    )  # => Output: debug task: ['debug']
    print("other task:", match(SKILLS, "write docs"))  # => Output: other task: []


main()  # => run once; name triggers the way tasks speak
