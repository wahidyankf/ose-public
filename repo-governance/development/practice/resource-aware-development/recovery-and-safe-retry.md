---
description: What HIPPO exits 73, 75, and 78 require before a retry, and the corrections that are never allowed.
when_to_use: Use when a guarded command exits non-zero and you are deciding whether and how to retry it.
---

# Recovery and Safe Retry

- Exit `73`: free storage safely, then retry.
- Exit `75`: inspect the receipt or outcome. Requeue only `never-started`; pressure-shed,
  storage-shed, and `started-safety-stop` require payload-specific recovery. Never duplicate or
  loop retries.
- Exit `78`: correct configuration, reservation, mapping, or strict-profile planning before retry.

Never bypass HIPPO, weaken a gate, delete possibly live state, or raise mapped concurrency.
Unreadable or corrupt shared state fails closed and `status` reports that error instead of a
partial document; confirm all compatibility owners exited before correcting private state.
