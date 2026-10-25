# => Example 18: paths are objects, not strings.
from pathlib import PurePosixPath  # => WHY pure: computes, never touches disk

base = PurePosixPath("/data/reports")  # => the directory anchor
full = base / "2026" / "summary.txt"  # => WHY slash: joining reads as joining
print(full)  # => Output: /data/reports/2026/summary.txt
print(full.name)  # => Output: summary.txt, final component
print(full.stem)  # => Output: summary, name without suffix
print(full.suffix)  # => Output: .txt, the extension alone
print(full.parent.name)  # => Output: 2026, structural, no splitting
print(full.relative_to(base))  # => Output: 2026/summary.txt, portable rest
