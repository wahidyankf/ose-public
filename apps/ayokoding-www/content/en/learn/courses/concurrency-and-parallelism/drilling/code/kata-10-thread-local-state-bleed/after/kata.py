"""Kata 10 (after): local() from threading gives each thread its OWN private "current request" slot."""

import threading
import time
from threading import local

request_context = local()  # FIX: each thread gets its own independent attribute namespace


def handle_request(worker_name: str, request_id: str, delay_before_read: float, observed: dict[str, str]) -> None:
    request_context.request_id = request_id  # => sets THIS thread's own slot -- other threads are untouched
    time.sleep(delay_before_read)
    observed[worker_name] = request_context.request_id  # => always reads back THIS thread's own value


observed: dict[str, str] = {}
worker_slow = threading.Thread(target=handle_request, args=("worker_slow", "REQ-A", 0.15, observed))
worker_fast = threading.Thread(target=handle_request, args=("worker_fast", "REQ-B", 0.0, observed))
worker_slow.start()
time.sleep(0.02)  # => same choreography as the before/ version, on purpose -- the FIX is in the data, not the timing
worker_fast.start()
worker_slow.join()
worker_fast.join()
print(observed)
# => Even though worker_fast runs and finishes entirely while worker_slow is still asleep,
# => `request_context` is a SEPARATE namespace per thread -- worker_fast's write to its own slot
# => cannot possibly touch worker_slow's slot, no matter how the two threads interleave.
assert observed["worker_slow"] == "REQ-A"  # => correctly sees its OWN id, unaffected by worker_fast
assert observed["worker_fast"] == "REQ-B"  # => correctly sees its own id too
print("kata OK (fix verified)")
