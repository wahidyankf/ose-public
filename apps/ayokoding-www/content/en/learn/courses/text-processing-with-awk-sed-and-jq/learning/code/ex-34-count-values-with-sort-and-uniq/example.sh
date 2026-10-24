#!/bin/bash
# => Worked Example 34: rank values with sort and uniq.
# => co-16: sort orders, uniq -c counts, awk normalizes the padding.
export LC_ALL=C                                         # => byte order for sort, identical on every machine
sort deploys.txt | uniq -c | awk '{ print $2 ": " $1 }' # => count each distinct value
# => awk splits on whitespace runs, so uniq's padding width never matters.
