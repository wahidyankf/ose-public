# Neo4j hello

**`learning/code/ex-01-hello/query.py`**

```python
"""Query Neo4j with only the standard library: HTTP API, RETURN 1 AS one."""

import json
import os
import time
import urllib.error
import urllib.request


def fetch(payload, host, port, deadline):
    request = urllib.request.Request(
        "http://%s:%d/db/neo4j/tx/commit" % (host, port),
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    while True:
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError):
            if time.monotonic() >= deadline:
                raise
            time.sleep(1)


def main():
    host = os.environ.get("NEO4J_HOST", "neo4j")
    port = int(os.environ.get("NEO4J_PORT", "7474"))
    payload = json.dumps({"statements": [{"statement": "RETURN 1 AS one"}]}).encode()
    # The readiness probe speaks bolt, which answers before the HTTP
    # listener opens; retry silently until it accepts connections.
    document = fetch(payload, host, port, time.monotonic() + 40)
    print(document["results"][0]["data"][0]["row"][0])


main()
```

**Output** (`learning/code/ex-01-hello/expected/query.stdout.txt`):

```text
1
```
