-- V003 creates third: rewound first, since unwind runs tip-down.
CREATE TABLE ex20_third (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the third name U003 removes first
);
