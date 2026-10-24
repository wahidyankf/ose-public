-- V003 indexes patron names for the search box query path.
CREATE INDEX ex17_patrons_name_idx ON ex17_patrons (name);

-- => the index serves name search without touching the table shape
