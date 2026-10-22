-- 0001 down: undo drops exactly what the up file created. -- => the reverse half of the pair
DROP TABLE gadgets; -- => undo runs this file, then forgets version 1
