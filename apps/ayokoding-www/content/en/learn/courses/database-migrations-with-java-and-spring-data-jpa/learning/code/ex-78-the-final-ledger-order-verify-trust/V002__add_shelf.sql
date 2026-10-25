-- V002 shelves every book: the data migration of the closing set.
ALTER TABLE ex78_library
ADD COLUMN shelf VARCHAR(20);

-- => nullable first: filled below, proven full by the final print
UPDATE ex78_library
SET
  shelf = 'classics';

-- => every book finds its shelf in the same transaction
