"""The data-home layout and the privacy policy every persistent object must satisfy."""

from typing import Final

PRIVATE_DIRECTORY_MODE: Final = 0o700
PRIVATE_FILE_MODE: Final = 0o600
GROUP_AND_OTHER_BITS: Final = 0o077

KEY_FILE: Final = "identity.key"
IDENTITY_FILE: Final = "identity.json"
CONFIG_FILE: Final = "config.json"
DATABASE_FILE: Final = "ferret.sqlite3"
LOCK_FILE: Final = "ferret.lock"

KEY_BYTES: Final = 32
DOCUMENT_SCHEMA_VERSION: Final = "1.0"
RETENTION_DAYS: Final = 30
MAINTENANCE_INTERVAL_SECONDS: Final = 3600
DATA_HOME_VARIABLE: Final = "FERRET_DATA_HOME"
DEFAULT_DATA_HOME_NAME: Final = ".ferret"


def is_private_mode(mode: int) -> bool:
    """True when neither the group nor anyone else holds any permission bit."""
    return mode & GROUP_AND_OTHER_BITS == 0
