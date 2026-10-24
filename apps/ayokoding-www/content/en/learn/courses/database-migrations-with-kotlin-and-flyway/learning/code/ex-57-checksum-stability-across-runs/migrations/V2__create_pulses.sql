-- V2: pulses reference a meter.
CREATE TABLE pulses (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER NOT NULL REFERENCES meters(id)
);
