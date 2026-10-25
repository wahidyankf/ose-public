-- U002 restores pending: the mirror UPDATE of V002.
-- Data rollbacks restore values where schema rollbacks drop structures.
UPDATE ex22_shipments
SET
  status = 'pending';

-- => every row returns to pending in the same transaction as row deletion
