-- V2: flour belongs to a mill.
CREATE TABLE flour (
    id SERIAL PRIMARY KEY,
    mill_id INTEGER NOT NULL REFERENCES mills(id),
    grade TEXT NOT NULL
);
