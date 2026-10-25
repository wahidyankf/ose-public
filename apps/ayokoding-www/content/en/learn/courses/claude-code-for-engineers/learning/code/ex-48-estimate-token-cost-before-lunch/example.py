# => Fixture shim adding token consumption across turns.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Counts are fixed data; counts, never prices, are reported.
# => Real behaviour may differ; confirm with claude --help.
TURNS = [(1200, 300), (800, 900), (2000, 400)]  # => input, output per turn


def add(turns):  # => total input and output tokens separately
    total_in = sum(i for i, o in turns)  # => 4000 input tokens here
    total_out = sum(o for i, o in turns)  # => 1600 output tokens here
    return total_in, total_out  # => the pair tells the session's shape


def share(turns):  # => which turn consumed the most tokens
    sizes = [i + o for i, o in turns]  # => per-turn totals
    return sizes.index(max(sizes)) + 1  # => turn numbers start at 1


def main():  # => report the token bill for three turns
    total_in, total_out = add(TURNS)  # => 4000 in, 1600 out
    print("input tokens:", total_in)  # => Output: input tokens: 4000
    print("output tokens:", total_out)  # => Output: output tokens: 1600
    print("heaviest turn:", share(TURNS))  # => Output: heaviest turn: 3


main()  # => run once; count tokens, discuss prices elsewhere
