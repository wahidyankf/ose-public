-- 0005: the later release tightens. -- => safe only after the fill
ALTER TABLE batches -- => the table keeps every filled row
    ALTER COLUMN code SET NOT NULL; -- => the strictness this sequence earned
