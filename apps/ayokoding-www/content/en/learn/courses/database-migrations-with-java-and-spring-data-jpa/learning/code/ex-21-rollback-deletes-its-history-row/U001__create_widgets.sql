-- U001 reverses V001 and deletes its ledger row in the same transaction.
-- Table and row go together: the ledger never claims an absent table.
DROP TABLE ex21_widgets;

-- => the table goes away, the runner deletes the 001 row alongside
