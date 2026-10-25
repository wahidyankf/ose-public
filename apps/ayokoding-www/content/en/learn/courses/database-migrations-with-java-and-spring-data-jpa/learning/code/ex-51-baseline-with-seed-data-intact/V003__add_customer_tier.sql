-- V003 adds the tier column to the adopted customers table.
ALTER TABLE ex51_customers
ADD COLUMN tier VARCHAR(20) NOT NULL DEFAULT 'standard';

-- => DEFAULT keeps adopted rows valid the moment the column appears
