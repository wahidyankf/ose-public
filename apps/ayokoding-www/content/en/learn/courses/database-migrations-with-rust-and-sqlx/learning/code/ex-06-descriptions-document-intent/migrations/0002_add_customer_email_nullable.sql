-- 0002: email arrives nullable so old rows survive. -- => the why is visible before opening the file
ALTER TABLE customers -- => the existing table keeps every row it already holds
    ADD COLUMN email TEXT; -- => nullable first: contact data fills in later
