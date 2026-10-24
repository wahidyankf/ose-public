-- 0001: parcels carry free-text kinds. -- => the values the lookup normalizes
CREATE TABLE parcels ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    kind TEXT NOT NULL -- => free text today, foreign key tomorrow
); -- => the definition closes here
