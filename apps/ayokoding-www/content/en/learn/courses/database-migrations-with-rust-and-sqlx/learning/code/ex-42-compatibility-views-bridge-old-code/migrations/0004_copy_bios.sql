-- 0004: twin every bio. -- => the new table fills from the old
INSERT INTO profiles (author_id, bio) -- => one profile per existing author
    SELECT id, bio FROM authors; -- => the copy, derived from live rows
