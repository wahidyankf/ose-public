// Example 29: Structs Carry State.
//
// A struct groups the fields one value needs; impl blocks attach the
// behavior that preserves its invariants. The thermometer below never
// holds an unreadable sensor: construction validates, methods convert,
// and Display prints, so every Thermometer value is usable by construction.
// => fields private, methods public: invariants live in the constructor
// => &self borrows for reads, &mut self for writes: the signature says so

use std::fmt;

// => fmt hosts Display: the human face of the refusal below

// Thermometer holds one Celsius reading known to be physically sane.
// => the field is private: outside code cannot set -300 and walk away
// => Copy is refused on purpose: readings move like measured things do
#[derive(Debug)]
struct Thermometer {
    // => one field, one invariant: sane Celsius or no value at all
    celsius: f64,
    // => f64 admits fractions: sensors report decimals, not integers
}

// ThermometerError names the two construction refusals, honestly.
// => BelowAbsoluteZero carries the value: the message shows where physics stopped
// => NotANumber carries nothing: NaN has no value worth quoting
#[derive(Debug)]
enum ThermometerError {
    // => two refusals, two physics: too cold versus not a number
    // => below absolute zero: physics refuses, so the type refuses first
    BelowAbsoluteZero(f64),
    // => not a number: NaN poisons every comparison it touches
    NotANumber,
}

// Display renders each refusal for the humans reading the transcript.
// => match every variant: adding a case forces a message for it too
// => write! to the formatter: no allocation beyond the final String
impl fmt::Display for ThermometerError {
    // => Display serves the transcript: main prints {reason} through it
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // => &self borrows: rendering a refusal must not consume it
        match self {
            // => self is the case: each arm renders one failure story
            // => the value rides along: -300.0 shows where physics stopped
            ThermometerError::BelowAbsoluteZero(value) => {
                write!(f, "{value} C is below absolute zero (-273.15 C)")
            }
            // => NaN has no value to show: the message names the poison
            ThermometerError::NotANumber => write!(f, "reading is not a number"),
        }
    }
}

// Error has no required methods here: the impl is the plug itself.
// => this one line admits the error into ? chains and boxed errors
// => Debug + Display above already satisfy the trait's only bounds
impl std::error::Error for ThermometerError {}

impl Thermometer {
    // => methods cluster here: construction, conversion, classification
    // => the only constructor: every value passes the physics guard
    fn new(celsius: f64) -> Result<Thermometer, ThermometerError> {
        // => Result instead of panic: physics refusals are data, not traps
        // => NaN first: it fails every comparison, so check it explicitly
        if celsius.is_nan() {
            return Err(ThermometerError::NotANumber);
        }
        // => absolute zero is the floor: colder readings cannot exist
        if celsius < -273.15 {
            return Err(ThermometerError::BelowAbsoluteZero(celsius));
        }
        Ok(Thermometer { celsius })
        // => shorthand init: the field name matches the parameter name
    }

    // => &self borrows: reading the temperature never consumes the meter
    fn fahrenheit(&self) -> f64 {
        // => f64 out: conversion keeps the fractional part
        // => the conversion every weather report on Earth applies daily
        self.celsius * 9.0 / 5.0 + 32.0
        // => 32.0 offsets the scales: freezing water reads 32, not zero
    }

    // => &self again: naming the band reads state without changing it
    fn band(&self) -> &'static str {
        // => 'static borrows: the band names outlive every thermometer
        // => match on ranges: the bands read like a legend, top-down
        match self.celsius {
            // => guards order the scale: each arm tests its ceiling in turn
            c if c < 0.0 => "freezing",
            // => freezing opens the legend: below zero, water turns to ice
            c if c < 20.0 => "cool",
            c if c < 30.0 => "warm",
            // => the catch-all closes the scale: heat has no ceiling here
            _ => "hot",
        }
    }
}

fn main() {
    // => three readings: clean, too cold, and not a number at all
    // => three readings: one clean, two refused for different physics
    for reading in [21.5, -300.0, f64::NAN] {
        // => construction decides: Ok prints conversions, Err explains
        match Thermometer::new(reading) {
            // => Debug shows the validated struct: construction did its job
            Ok(meter) => println!("{meter:?}: {} F, {}", meter.fahrenheit(), meter.band()),
            // => Display shows the refusal: physics, not a trap, said no
            Err(reason) => println!("{reading}: refused: {reason}"),
        }
    }
}
