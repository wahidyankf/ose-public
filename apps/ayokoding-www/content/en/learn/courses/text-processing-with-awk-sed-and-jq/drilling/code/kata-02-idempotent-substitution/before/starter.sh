#!/bin/bash
# => Kata 2 starter: an unanchored substitution that corrupts version 10.
# => Task: upgrade "version 1" to "version 2" without touching "version 10".
# => Rerunning the reference must print the same output twice (see Example 39).
sed 's/version 1/version 2/' releases.txt
