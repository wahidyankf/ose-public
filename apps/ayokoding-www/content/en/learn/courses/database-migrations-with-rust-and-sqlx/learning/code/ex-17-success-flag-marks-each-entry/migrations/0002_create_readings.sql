-- 0002: readings belong to sensors. -- => the second healthy row
CREATE TABLE readings ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    sensor_id INTEGER NOT NULL REFERENCES sensors (id), -- => every reading comes from a sensor
    value DOUBLE PRECISION NOT NULL -- => readings store as floating values
); -- => the definition closes here
