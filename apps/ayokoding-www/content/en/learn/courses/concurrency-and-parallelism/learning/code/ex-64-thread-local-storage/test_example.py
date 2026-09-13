"""Example 64: pytest verification for `local()` from `threading` Per-Thread Isolation."""

import threading

from example import set_and_read_own_value


def test_thread_local_values_never_bleed_across_threads() -> None:
    observed: dict[int, int] = {}
    threads = [threading.Thread(target=set_and_read_own_value, args=(i, observed)) for i in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    for thread_id, value in observed.items():
        assert value == thread_id * 1000  # => no thread ever saw another thread's value
    assert len(observed) == 5  # => all 5 threads completed and recorded their own distinct value


# => Run: pytest -- Output: 1 passed
