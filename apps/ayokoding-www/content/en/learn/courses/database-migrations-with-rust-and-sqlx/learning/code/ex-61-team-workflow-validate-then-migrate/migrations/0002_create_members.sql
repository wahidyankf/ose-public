-- 0002: members join teams. -- => the second version the gate checks
CREATE TABLE members ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    team_id INTEGER NOT NULL REFERENCES teams (id), -- => every member belongs to a team
    handle TEXT NOT NULL -- => every member picks a handle
); -- => the definition closes here
