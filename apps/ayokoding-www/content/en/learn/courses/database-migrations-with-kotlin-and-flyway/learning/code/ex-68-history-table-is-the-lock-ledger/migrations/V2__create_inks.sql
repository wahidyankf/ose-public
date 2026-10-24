-- V2: inks belong to a pen.
CREATE TABLE inks (
    id SERIAL PRIMARY KEY,
    pen_id INTEGER NOT NULL REFERENCES pens(id),
    color TEXT NOT NULL
);
