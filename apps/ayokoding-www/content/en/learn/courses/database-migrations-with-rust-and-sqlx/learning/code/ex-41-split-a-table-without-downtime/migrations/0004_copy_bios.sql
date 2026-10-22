-- 0004: twin every bio. -- => the data side of the split
INSERT INTO profiles (author_id, bio) -- => one profile per existing author
    SELECT id, bio FROM authors; -- => the copy, derived from live rows
