# => Fixture shim of project memory file lookup order.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Files are fixed data; nothing is loaded here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY project first: repo conventions outrank personal habit.
# => Stale memory misleads as confidently as fresh guides.
# => Short tested entries survive; essays get ignored.
# => Quarterly review deletes what the project outgrew.

FILES = [
    "./CLAUDE.md",
    "./AGENTS.md",
    "~/.claude/MEMORY.md",
]  # => project pair plus user memory


def lookup(files, present):  # => return the files present, in priority order
    return [f for f in files if f in present]  # => order above is the priority


def answers(order):  # => the first present file answers first
    return order[0] if order else "no memory"  # => project memory beats user memory


def main():  # => look up memory among two present files
    present = {
        "./AGENTS.md",
        "~/.claude/MEMORY.md",
    }  # => project AGENTS plus user memory
    order = lookup(FILES, present)  # => AGENTS.md first, then user memory
    print("order:", order)  # => Output: order: ['./AGENTS.md', '~/.claude/MEMORY.md']
    print("answers:", answers(order))  # => Output: answers: ./AGENTS.md


main()  # => run once; write memory the agent actually loads
