#!/bin/bash
# => Kata 5 starter: redacts one known value, missing every other secret.
# => Task: redact every token= and key= value, rerun-safe (see Example 42).
# => The answer must redact all three secret lines and keep user=adi.
sed 's/abc123/REDACTED/' config.txt
