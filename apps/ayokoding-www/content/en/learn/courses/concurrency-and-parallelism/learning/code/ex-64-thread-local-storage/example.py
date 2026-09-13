"""Example 64: `local()` from `threading` -- Per-Thread State That Never Bleeds Across Threads."""

import threading  # => co-07, co-19: the built-in escape hatch from shared-mutable-state hazards
from threading import local  # => co-07: the per-thread storage class, imported by name

_thread_local = local()  # => _thread_local: ONE object, but EVERY thread sees its OWN separate attributes


def set_and_read_own_value(thread_id: int, observed: dict[int, int]) -> None:
    _thread_local.value = thread_id * 1000  # => sets an attribute on _thread_local -- but ONLY for THIS thread
    for _ in range(3):  # => reads it back multiple times, checking it never changes underneath this thread
        assert _thread_local.value == thread_id * 1000  # => confirms THIS thread's own value stayed stable
    observed[thread_id] = _thread_local.value  # => records what THIS thread saw, for the cross-thread check below


if __name__ == "__main__":  # => module entry point
    observed: dict[int, int] = {}  # => observed: filled in by each thread with ITS OWN _thread_local.value
    threads = [threading.Thread(target=set_and_read_own_value, args=(i, observed)) for i in range(6)]
    for t in threads:  # => starts every thread
        t.start()  # => each thread immediately sets and re-reads its OWN _thread_local.value
    for t in threads:  # => waits for every thread to finish
        t.join()  # => join() blocks until that thread's set_and_read_own_value() call returns

    print(f"observed={observed}")  # => Output: observed={0: 0, 1: 1000, 2: 2000, 3: 3000, 4: 4000, 5: 5000}

    # => `local()` from `threading` creates an object whose ATTRIBUTES are secretly per-thread: setting
    # => `_thread_local.value` in thread 3 does NOT affect what thread 5 sees when it reads
    # => `_thread_local.value` -- each thread gets its OWN isolated slot for the SAME attribute name,
    # => automatically, with zero explicit locking (co-19). This is the standard tool for state that
    # => should be shared-BY-NAME but never shared-BY-VALUE across threads -- e.g. a per-request
    # => database connection, or a per-thread random number generator seed (co-07's isolation, but
    # => achieved WITHIN one process, unlike ex-02's process-level isolation).
    for thread_id, value in observed.items():  # => checks EVERY thread's own recorded value
        assert value == thread_id * 1000  # => confirms no thread ever saw ANOTHER thread's value -- no bleed
    assert len(observed) == 6  # => confirms all 6 threads completed and recorded their own distinct value
    print("ex-64 OK")  # => Output: ex-64 OK
