"""Deny every network access of the Python process that imports this at startup, and note each attempt.

With this directory on ``PYTHONPATH`` the interpreter imports the module before the program runs. An audit hook sees a
socket created, connected, or resolved anywhere, standard library included, so no module can go around it. The refusal
is an ``OSError``, which a program may catch, so each attempt is also appended to the file named by the environment
variable and a test reads that file rather than trusting the program to fail.

Standard library only: this runs before anything else and must not depend on the program under test.
"""

import os
import sys

LOG_VARIABLE = "FERRET_DENIED_SOCKETS_LOG"
NETWORK_EVENT_PREFIX = "socket."


def _refuse(event: str, arguments: tuple[object, ...]) -> None:
    if not event.startswith(NETWORK_EVENT_PREFIX):
        return
    log = os.environ.get(LOG_VARIABLE)
    if log:
        with open(log, "a", encoding="utf-8") as handle:
            handle.write(f"{event}\n")
    raise PermissionError(f"network access is denied: {event} {arguments!r}")


sys.addaudithook(_refuse)
