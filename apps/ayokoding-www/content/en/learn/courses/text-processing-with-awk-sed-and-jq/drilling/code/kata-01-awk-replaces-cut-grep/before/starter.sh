#!/bin/bash
# => Kata 1 starter: a grep plus cut chain that works but splits the job.
# => Task: print the names of engineers with ONE awk program (see Example 44).
# => The answer must print exactly the reference output, with no pipe.
grep 'engineer' employees.txt | cut -d: -f1
