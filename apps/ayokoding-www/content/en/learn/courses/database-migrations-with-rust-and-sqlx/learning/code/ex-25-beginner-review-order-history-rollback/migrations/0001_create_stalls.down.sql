-- 0001 down: undo would drop stalls. -- => not run: the undo stops at version 1
DROP TABLE stalls; -- => version 1 stays, so this file waits
