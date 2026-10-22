-- 0003: two dark launches. -- => the rollout candidates
INSERT INTO launches (name) -- => flags default to false
    VALUES ('search'), -- => launch 1: stays dark
    ('checkout'); -- => launch 2: flips live next
