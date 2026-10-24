-- seed.sql: repeatable reference refresh, outside the version chain. -- => rerun any time, changes nothing twice
INSERT INTO zones (code) -- => reference rows, maintained not migrated
    VALUES ('eu'), -- => the first zone
    ('us') -- => the second zone
    ON CONFLICT (code) DO NOTHING; -- => reruns add only what is missing
