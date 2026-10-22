-- 0001: authors start wide. -- => bio lives here until the split
CREATE TABLE authors ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL, -- => the column that stays
    bio TEXT NOT NULL -- => the column the split moves out
); -- => the definition closes here
