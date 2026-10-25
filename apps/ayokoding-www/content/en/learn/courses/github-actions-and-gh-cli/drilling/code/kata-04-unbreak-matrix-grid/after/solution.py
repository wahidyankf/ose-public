# => Kata reference: two versions times two modes is four cells.
# => Checked against the vendor matrix strategy docs on 2026-10-20.
# => AXES mirrors the corrected strategy.matrix block in the file.
# => Sorted axes keep the expansion order stable across runs.

# => WHY expand offline: the count tells whether the grid still fits.
# => A collapsed axis silently halves coverage; expansion shows it.
# => Two-by-two is four; memorize products, not assumptions.
AXES = {"mode": ["fast", "full"], "python": ["3.13", "3.14"]}  # => grid


def expand():  # => cartesian product over the sorted axes
    cells = [dict()]  # => start with one empty combination
    for name in sorted(AXES):  # => sorted axes keep order stable
        cells = [dict(c, **{name: v}) for c in cells for v in AXES[name]]  # => grow
    return sorted(cells, key=lambda c: tuple(sorted(c.items())))  # => stable


def main():  # => print every cell plus the total count
    cells = expand()  # => the four combinations
    for cell in cells:  # => one line per job, stable order
        print("job:", cell["python"] + "/" + cell["mode"])  # => cell name
    print("jobs:", len(cells))  # => Output: 4


main()  # => run once; any count but 4 means an axis collapsed
