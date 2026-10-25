#!/bin/bash
# => Kata 3 starter: .groups[].members emits one array per group, not members.
# => Task: print every member on its own raw line (see Examples 23 and 27).
# => The answer must print three plain names, with no brackets or quotes.
jq '.groups[].members' nested.json
