# => Example 13: with pairs every acquire with its release.
import tempfile  # => stdlib scratch files: no fixture needed
import os  # => path join plus cleanup live here

path = os.path.join(tempfile.gettempdir(), "ex13-note.txt")  # => fixed scratch name
with open(path, "w", encoding="utf-8") as handle:  # => WHY with: close guaranteed
    handle.write("remember\n")  # => write inside the managed block
print(handle.closed)  # => Output: True, released despite no explicit close
with open(path, encoding="utf-8") as handle:  # => reopen for the read half
    print(repr(handle.read()))  # => Output: 'remember\n', round trip kept
os.remove(path)  # => scratch removed: leaves no trace behind
from threading import Lock  # => locks pair the same way files do

lock = Lock()  # => one mutual-exclusion lock for the demo
with lock:  # => WHY with: unlock guaranteed on every exit path
    print("held:", lock.locked())  # => Output: held: True, inside critical
print("held:", lock.locked())  # => Output: held: False, released after
