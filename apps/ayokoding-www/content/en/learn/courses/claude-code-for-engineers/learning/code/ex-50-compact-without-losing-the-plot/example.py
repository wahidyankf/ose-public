# => Fixture shim of session compaction into a kept summary.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Turns are fixed data; nothing is summarized for real.
# => Real behaviour may differ; confirm with claude --help.

# => WHY compact early: checking needs a memory you still hold.
# => Open items stated plainly survive summarization.
# => Lossy by design, so choose what survives.

TURNS = [
    "decided: use check()",
    "chatter: hmm let me see",
    "open: write test",
]  # => three turns


def keep(turns):  # => keep decisions and open items, drop chatter
    kept = [
        t for t in turns if t.startswith(("decided", "open"))
    ]  # => two lines survive
    return kept  # => the compacted summary lines


def ratio(turns, kept):  # => how much context compaction reclaimed
    return "%d of %d kept" % (len(kept), len(turns))  # => 2 of 3 here


def main():  # => compact three turns and report the ratio
    kept = keep(TURNS)  # => decisions and open items survive
    print("kept:", kept)  # => Output: kept: the two surviving lines
    print("ratio:", ratio(TURNS, kept))  # => Output: ratio: 2 of 3 kept


main()  # => run once; compact before the window fills
