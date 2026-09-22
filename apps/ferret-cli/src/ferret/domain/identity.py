"""Identity: opaque identifiers derived under the installation key, and idempotent storage of producer-owned artifacts.

An artifact ID is stored once and its hash decides duplicate or conflict.
"""

import hashlib
import hmac
from typing import Final, Literal

from ferret.domain.errors import FerretError

type IdentityDecision = Literal["insert", "duplicate"]
type IdentifierKind = Literal["ws", "ss"]

_LABEL: Final = "ferret/id/1"
_DIGEST_HEX_CHARACTERS: Final = 32


def derive_identifier(key: bytes, kind: IdentifierKind, *parts: str) -> str:
    """The opaque workspace (``ws``) or session (``ss``) identifier for ``parts``, keyed by the installation's secret.

    It is the first sixteen bytes, in hex, of HMAC-SHA256 over the label, the kind, and the parts joined by NUL, so a
    low-entropy path or session value cannot be recovered or enumerated without the key. A part must not contain NUL:
    the hook mappers refuse control characters before any value gets here.
    """
    message = b"\0".join(part.encode("utf-8") for part in (_LABEL, kind, *parts))
    return f"{kind}_{hmac.new(key, message, hashlib.sha256).hexdigest()[:_DIGEST_HEX_CHARACTERS]}"


def resolve_identity(existing_hash: str | None, incoming_hash: str) -> IdentityDecision:
    """What an ID that may already be stored means for the incoming event or capability snapshot.

    An unseen ID is inserted. The same ID with the same hash is an idempotent duplicate, compared in constant time.
    The same ID with a different hash is a conflict: the ID is never reused for other content, and different IDs
    are never deduplicated by hash alone.
    """
    if existing_hash is None:
        return "insert"
    if hmac.compare_digest(existing_hash.encode("utf-8"), incoming_hash.encode("utf-8")):
        return "duplicate"
    raise FerretError("ferret.event.idempotency-conflict")
