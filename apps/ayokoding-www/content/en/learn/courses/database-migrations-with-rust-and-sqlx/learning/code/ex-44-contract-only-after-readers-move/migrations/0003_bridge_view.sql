-- 0003: the bridge serves legacy readers. -- => retired with the column it covers
CREATE VIEW authors_full AS -- => the frozen contract over evolving tables
    SELECT a.name, p.bio -- => the wide shape, reconstructed by join
    FROM authors a JOIN profiles p ON p.author_id = a.id; -- => the bridge between old and new
