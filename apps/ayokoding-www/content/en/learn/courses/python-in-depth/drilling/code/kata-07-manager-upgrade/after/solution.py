# => Kata 7 solution: the pairing is two adjacent lines.
from contextlib import contextmanager  # => WHY decorator: protocol in one function

log = []  # => the same stand-in resource


@contextmanager  # => acquire-yield-release becomes a with block
def session():  # => the bracketed region, named once
    log.append("acquire")  # => WHY entry: runs before the body
    try:  # => WHY finally: exit survives body exceptions
        yield "handle"  # => the body runs here
    finally:  # => structural pairing, not discipline
        log.append("release")  # => guaranteed on every exit path


with session() as handle:  # => WHY with: the pairing visible
    log.append("work")  # => the body between acquire and release
print(log)  # => Output: ['acquire', 'work', 'release'], correct by structure
print(handle)  # => Output: handle, the yielded value bound
