# PostgreSQL hello

**`learning/code/ex-01-hello/query.py`**

```python
"""Query PostgreSQL with only the standard library: trust auth, select 1."""

import os
import socket
import struct


def read_message(conn):
    header = b""
    while len(header) < 5:
        chunk = conn.recv(5 - len(header))
        if not chunk:
            raise RuntimeError("connection closed")
        header += chunk
    kind = header[0:1]
    (length,) = struct.unpack("!i", header[1:5])
    body = b""
    while len(body) < length - 4:
        chunk = conn.recv(length - 4 - len(body))
        if not chunk:
            raise RuntimeError("connection closed")
        body += chunk
    return kind, body


def main():
    host = os.environ.get("PGHOST", "postgres")
    port = int(os.environ.get("PGPORT", "5432"))
    user = os.environ.get("PGUSER", "postgres")
    database = os.environ.get("PGDATABASE", "postgres")
    startup = struct.pack("!i", 196608)
    params = (
        b"user\x00"
        + user.encode()
        + b"\x00database\x00"
        + database.encode()
        + b"\x00\x00"
    )
    conn = socket.create_connection((host, port), timeout=10)
    conn.sendall(struct.pack("!i", len(startup) + len(params) + 4) + startup + params)
    kind, body = read_message(conn)
    if kind != b"R" or struct.unpack("!i", body[:4])[0] != 0:
        raise RuntimeError("unexpected auth response")
    while True:
        kind, _ = read_message(conn)
        if kind == b"Z":
            break
    query = b"select 1\x00"
    conn.sendall(b"Q" + struct.pack("!i", 4 + len(query)) + query)
    value = None
    while True:
        kind, body = read_message(conn)
        if kind == b"D":
            (nfields,) = struct.unpack("!h", body[:2])
            pos = 2
            for _ in range(nfields):
                (length,) = struct.unpack("!i", body[pos : pos + 4])
                pos += 4
                value = body[pos : pos + length].decode()
                pos += length
        elif kind == b"Z":
            break
        elif kind == b"E":
            raise RuntimeError("query error")
    print(value)


main()
```

**Output** (`learning/code/ex-01-hello/expected/query.stdout.txt`):

```text
1
```
