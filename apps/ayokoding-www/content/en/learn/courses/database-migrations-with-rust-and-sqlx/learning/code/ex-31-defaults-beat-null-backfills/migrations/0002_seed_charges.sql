-- 0002: two pre-default rows. -- => old data the default must absorb
INSERT INTO charges (amount) -- => no currency column exists yet
    VALUES (100), -- => charge 1
    (250); -- => charge 2
