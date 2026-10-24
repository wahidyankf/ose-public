-- 0001: beacons anchor the gate. -- => the version the gate checks
CREATE TABLE beacons ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every beacon must be named
); -- => the definition closes here
