-- V002 creates second: rewound by U002 during the rollback to V001.
CREATE TABLE ex20_second (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the second name U002 removes
);
