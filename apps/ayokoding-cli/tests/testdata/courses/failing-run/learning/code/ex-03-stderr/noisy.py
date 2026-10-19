"""Warn on standard error where the spec expects empty (fixture)."""

import sys
import time

print("warning: slow mirror", file=sys.stderr)
time.sleep(1)
print("done")
