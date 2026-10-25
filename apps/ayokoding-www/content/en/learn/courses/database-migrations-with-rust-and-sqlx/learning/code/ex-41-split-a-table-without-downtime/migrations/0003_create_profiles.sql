-- 0003: profiles arrive empty. -- => expansion for the table split
CREATE TABLE profiles ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    author_id INTEGER NOT NULL UNIQUE REFERENCES authors (id), -- => one profile per author
    bio TEXT NOT NULL -- => the moved column finds its new home
); -- => the definition closes here
