#!/bin/bash
# => Worked Example 48: route three tasks to three tools, then verify.
# => co-15: columns go to awk, addressed lines to sed, nested JSON to jq.
# => co-16: one script chains all three tools, each owning its shape.
set -euo pipefail                                                           # => strict mode: fail fast on errors and unset names
echo "task columns:"                                                        # => columns mean awk: count the finished rows
awk -F, 'NR > 1 && $3 == "done" { n++ } END { print "done: " n }' tasks.csv # => two rows carry done
echo "task lines:"                                                          # => addressed lines mean sed: drop the comment lines
sed '/^#/d' checklist.txt | awk '{ print $1 }'                              # => print the first word of each check
echo "task json:"                                                           # => nested structure means jq: read the deploy status
jq '.deploy' status.json                                                    # => one field out of the status object
# => three shapes, three tools, zero contortions: the checklist works.
