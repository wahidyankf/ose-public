-- 0003: profiles take the bios. -- => the new home fills before any drop
CREATE TABLE profiles ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    author_id INTEGER NOT NULL UNIQUE REFERENCES authors (id), -- => one profile per author
    bio TEXT NOT NULL -- => the moved column finds its new home
); -- => the definition closes here
