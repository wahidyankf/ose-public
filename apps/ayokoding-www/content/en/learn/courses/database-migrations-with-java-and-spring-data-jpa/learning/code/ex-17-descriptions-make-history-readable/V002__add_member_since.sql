-- V002 records when each patron joined the library.
CREATE TABLE ex17_placeholder_dates (id SERIAL PRIMARY KEY);

-- => placeholder keeps the file non-empty while the alter below does the work
DROP TABLE ex17_placeholder_dates;

-- => placeholder removed in the same transaction: description stays honest
ALTER TABLE ex17_patrons
ADD COLUMN member_since DATE NOT NULL DEFAULT CURRENT_DATE;

-- => DEFAULT keeps existing patron rows valid at alter time
