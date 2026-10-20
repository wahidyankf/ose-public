# => Fixture shim separating safe from volatile session state.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => State is fixed data; nothing is interrupted here.
# => Real behaviour may differ; confirm with claude --help.
STATE = {"committed": ["login fix"], "draft": ["auth idea"]}  # => safe versus volatile


def interrupt(state):  # => keep committed work, name the volatile loss
    kept = list(state["committed"])  # => committed work survives always
    lost = list(state["draft"])  # => uncommitted drafts evaporate
    return kept, lost  # => the honest accounting of an interrupt


def main():  # => interrupt a session with one commit and one draft
    kept, lost = interrupt(STATE)  # => one kept, one lost
    print("kept:", kept)  # => Output: kept: ['login fix']
    print("lost:", lost)  # => Output: lost: ['auth idea']


main()  # => run once; interrupt early, interrupt often, commit first
