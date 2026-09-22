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
#: Where the fail-open callback records that it lost an event, so silence is not the only evidence.
HOOK_FAILURE_FILE: Final = "hook-failures.log"
#: The most recent records kept. Bounded so a harness that fails on every call cannot fill the data home.
HOOK_FAILURE_LIMIT: Final = 100

KEY_BYTES: Final = 32
DOCUMENT_SCHEMA_VERSION: Final = "1.0"
RETENTION_DAYS: Final = 30
MAINTENANCE_INTERVAL_SECONDS: Final = 3600
DATA_HOME_VARIABLE: Final = "FERRET_DATA_HOME"
#: The base directory specification's variable for user data, and the directory FERRET takes inside it.
XDG_DATA_HOME_VARIABLE: Final = "XDG_DATA_HOME"
XDG_DATA_HOME_DEFAULT: Final = ".local/share"
DATA_HOME_NAME: Final = "ferret"
#: Where FERRET kept its data before it followed the base directory specification. Adopted once, then gone.
LEGACY_DATA_HOME_NAME: Final = ".ferret"


def is_private_mode(mode: int) -> bool:
    """True when neither the group nor anyone else holds any permission bit."""
    return mode & GROUP_AND_OTHER_BITS == 0
