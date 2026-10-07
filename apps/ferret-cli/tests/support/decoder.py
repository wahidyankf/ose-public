"""Make ``json.loads`` give up on a document the way the interpreter's decoder does, on every platform.

CPython 3.14 bounds the recursion of its C JSON scanner by the C stack the thread has left, not by a fixed count, so how
deep a document must nest before ``json.loads`` raises ``RecursionError`` follows the stack size, the architecture, and
the compiler. A document of 100,000 opened arrays exhausts an 8 MiB stack on macOS and on Linux, yet is an ordinary
``JSONDecodeError`` for a decoder that has a larger stack. A test that needs the decoder to have given up forces that
with ``gives_up_on`` instead of hoping its input is deep enough.
"""

import json
from collections.abc import Sequence
from typing import Any, Final

import pytest

# The message CPython's own scanner gives, so a failure shown in a report reads as the real one would.
GIVING_UP: Final = "maximum recursion depth exceeded while decoding a JSON array from a unicode string"


def gives_up_on(
    monkeypatch: pytest.MonkeyPatch, document: bytes, *, after_closing: Sequence[Sequence[tuple[str, object]]] = ()
) -> None:
    """Until the test ends, ``json.loads`` raises ``RecursionError`` on ``document`` and reads any other text as usual.

    ``document`` is compared as bytes, so it matches whether the caller passes the bytes or their UTF-8 text.
    Each of ``after_closing`` is the member list of an object the decoder is taken to have closed before it gave up. It
    is handed to the ``object_pairs_hook`` the caller passed, as the real decoder hands it, so a test can show what the
    caller recorded before the depth failure.
    """
    read = json.loads

    def loads(text: str | bytes, **options: Any) -> Any:
        if (text.encode() if isinstance(text, str) else text) != document:
            return read(text, **options)
        for members in after_closing:
            options["object_pairs_hook"](list(members))
        raise RecursionError(GIVING_UP)

    monkeypatch.setattr(json, "loads", loads)
