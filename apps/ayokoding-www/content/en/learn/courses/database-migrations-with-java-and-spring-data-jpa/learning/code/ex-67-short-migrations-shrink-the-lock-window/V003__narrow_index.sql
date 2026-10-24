-- V003 indexes the name: the third narrow window in the chain.
CREATE INDEX ex67_narrow_name_idx ON ex67_narrow (name);

-- => the index lands under its own brief lock, long after the table did
