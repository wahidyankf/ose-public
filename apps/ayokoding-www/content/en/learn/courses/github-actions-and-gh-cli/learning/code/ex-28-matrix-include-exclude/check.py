# => Offline matrix expander for the matrix-include-exclude workflow file.
# => Checked against the vendor strategy docs on 2026-10-20.
# => AXES mirrors the strategy.matrix block in workflow.yaml.
# => No network and no live repository; expansion is pure math.
# => WHY expand offline: count the jobs before they bill minutes.
# => INCLUDE and EXCLUDE rows reshape the grid after the product.
from pathlib import Path  # => locate the data file beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
AXES = {
    "os": ["ubuntu-latest", "windows-latest"],
    "python-version": ["3.13", "3.14"],
}  # => axis name to value list, mirrors the yaml
INCLUDE = [
    {"os": "ubuntu-latest", "python-version": "3.13", "coverage": True}
]  # => extra cells added after the product
EXCLUDE = [
    {"os": "windows-latest", "python-version": "3.14"}
]  # => cells removed after the product


def expand():  # => cartesian product of every axis, then reshape
    cells = [dict()]  # => start with one empty combination
    for name in sorted(AXES):  # => sorted axes keep order stable
        cells = [dict(c, **{name: v}) for c in cells for v in AXES[name]]  # => grow
    cells.extend(dict(c) for c in INCLUDE)  # => add the special cells
    cells = [c for c in cells if c not in EXCLUDE]  # => drop the banned ones
    order = sorted(AXES)  # => axis display order, alphabetical
    cells.sort(key=lambda c: tuple(str(c[k]) for k in order))  # => stable sort
    return cells  # => every job the strategy would create


def label(cell):  # => one readable name per matrix cell
    order = sorted(AXES)  # => same axis order as the listing
    # => Extra keys like coverage ride along but never join the label.
    # => Labels stay short; the full cell is visible in the file.
    return "-".join(str(cell[k]) for k in order if k in cell)  # => dash join


def main():  # => print every cell plus the final count
    cells = expand()  # => the full expanded grid
    for cell in cells:  # => one line per job, stable order
        print("job:", label(cell))  # => Output: one matrix combination
    print("jobs:", len(cells))  # => Output: total job count


main()  # => run once; count the jobs before pushing the file
