-- 0002: works fill the ateliers. -- => the second version under final review
CREATE TABLE works ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    atelier_id INTEGER NOT NULL REFERENCES ateliers (id), -- => every work belongs to an atelier
    title TEXT NOT NULL -- => every work must be titled
); -- => the definition closes here
