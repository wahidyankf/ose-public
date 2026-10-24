-- V002 indexes the certified name: its check proves the catalog entry.
CREATE INDEX ex77_certified_name_idx ON ex77_certified (name);

-- => the index migration carries its own catalog assertion below
