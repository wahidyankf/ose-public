-- V2: readings reference a sensor.
CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id),
    value DOUBLE PRECISION NOT NULL
);
