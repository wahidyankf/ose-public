"""Print the fixed run environment facts (fixture for determinism)."""

import os

print("SECRET_TOKEN=" + os.environ.get("SECRET_TOKEN", "absent"))
print("TZ=" + os.environ.get("TZ", "absent"))
print("SOURCE_DATE_EPOCH=" + os.environ.get("SOURCE_DATE_EPOCH", "absent"))
