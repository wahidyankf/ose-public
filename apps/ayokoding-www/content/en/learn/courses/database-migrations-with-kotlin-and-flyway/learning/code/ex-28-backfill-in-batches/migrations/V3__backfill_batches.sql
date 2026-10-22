-- V3: two disjoint ranges cover every row once.
UPDATE events SET processed = true WHERE id <= 2;
UPDATE events SET processed = true WHERE id > 2;
