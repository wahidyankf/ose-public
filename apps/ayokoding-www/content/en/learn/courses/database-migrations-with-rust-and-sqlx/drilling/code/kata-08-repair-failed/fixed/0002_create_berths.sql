-- 0002 fixed: berths belong to docks. -- => corrected content, still the free number
CREATE TABLE berths ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    dock_id INTEGER NOT NULL REFERENCES docks (id), -- => every berth sits at a dock
    label TEXT NOT NULL -- => every berth must be labeled
); -- => the definition closes here
