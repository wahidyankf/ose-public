# => Example 14: suppress states tolerated errors as policy.
from contextlib import suppress  # => the narrow-swallow helper lives here

seen = {"ada": 1}  # => mapping with one key the demo deletes twice
with suppress(KeyError):  # => WHY suppress: second delete is expected
    del seen["grace"]  # => absent key: tolerated, no branch needed
print(seen)  # => Output: {'ada': 1}, untouched by the miss
with suppress(KeyError):  # => same tolerance for a present key path
    del seen["ada"]  # => present: actually removed this time
print(seen)  # => Output: {}, removal worked when there was work
with suppress(FileNotFoundError):  # => optional files may simply be absent
    import os  # => removal helper imported where the tolerance applies

    os.remove("/tmp/ex14-never-created.txt")  # => missing file: fine here
print("cleanup tolerated")  # => Output: cleanup tolerated
