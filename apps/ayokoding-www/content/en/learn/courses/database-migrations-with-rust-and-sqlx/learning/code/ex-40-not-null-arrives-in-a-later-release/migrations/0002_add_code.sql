-- 0002: the code column ships nullable. -- => readers and writers adopt gradually
ALTER TABLE batches -- => existing rows stay exactly where they are
    ADD COLUMN code TEXT; -- => NULL until the fill assigns values
