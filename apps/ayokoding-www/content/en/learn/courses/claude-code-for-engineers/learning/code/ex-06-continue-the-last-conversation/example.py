# => Fixture shim of continuing the most recent conversation.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The transcript store is fixed data; nothing is read from disk.
# => Real behaviour may differ; confirm with claude --help.
STORE = {"last": ["draft login", "add test"]}  # => the two turns on record


def latest(store):  # => find the most recent conversation id
    ids = sorted(store.keys())  # => sorted keeps the choice deterministic
    return ids[-1]  # => last sorts after everything else here


def resume(store, cid):  # => reload that conversation's turns
    turns = list(store[cid])  # => copy so the store never mutates
    return turns  # => the reloaded turns come back in order


def main():  # => continue last and show what came back
    cid = latest(STORE)  # => cid is last, the only conversation
    turns = resume(STORE, cid)  # => turns holds the two recorded lines
    print("resumed:", cid)  # => Output: resumed: last
    print("turns:", len(turns))  # => Output: turns: 2
    print("first:", turns[0])  # => Output: first: draft login


main()  # => run once; continuing never rewrites history
