-- 0003: visits link doctors. -- => the third fact in the dump
CREATE TABLE visits ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    doctor_id INTEGER NOT NULL REFERENCES doctors (id), -- => every visit sees a doctor
    noted_on DATE NOT NULL -- => every visit happens on a date
); -- => the definition closes here
