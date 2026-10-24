-- U002 reverses V002: drops exactly the table V002 created.
-- Down files mirror their up version: U002 undoes V002, nothing else.
-- The runner deletes the V002 ledger row in the same transaction.
DROP TABLE ex18_temps;

-- => the table goes away, the keepers table from V001 is untouched
