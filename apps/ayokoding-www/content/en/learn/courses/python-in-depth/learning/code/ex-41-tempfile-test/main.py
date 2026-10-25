# => Example 41: private scratch per test, content asserted.
import tempfile  # => WHY tempdir: unique private tree per run
from pathlib import Path  # => WHY Path: the habit from Example 18

with tempfile.TemporaryDirectory() as scratch:  # => isolated, auto-removed
    target = Path(scratch) / "note.txt"  # => WHY Path: join by slash, no strings
    target.write_text("remember\n", encoding="utf-8")  # => the write under test
    back = target.read_text(encoding="utf-8")  # => read back the same bytes
    print(back == "remember\n")  # => Output: True, round trip exact
    print(target.name)  # => Output: note.txt, name stable, path not shown
print("scratch gone")  # => Output: scratch gone, block exit removed it
