-- V002 extends the gate: unique versions let it apply cleanly.
ALTER TABLE ex59_gate
ADD COLUMN code VARCHAR(20);

-- => unique numbering is what the scan gate certified above
