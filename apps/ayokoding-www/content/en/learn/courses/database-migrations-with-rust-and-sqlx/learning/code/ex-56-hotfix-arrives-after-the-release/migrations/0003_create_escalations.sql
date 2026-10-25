-- 0003: escalations reference tickets. -- => applies once, skips on re-runs
CREATE TABLE escalations ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    ticket_id INTEGER NOT NULL REFERENCES tickets (id) -- => every escalation names a ticket
); -- => the definition closes here
