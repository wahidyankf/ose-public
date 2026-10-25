// => Example 50: kilometres over hours give speed, checked by the compiler.
[<Measure>] type km // => the kilometre dimension, declared once.
[<Measure>] type h // => the hour dimension, declared once.
// => Quantities carry their dimension in the type: bare floats cannot sneak in.
let distance = 150.0<km> // => one hundred fifty kilometres, typed.
let duration = 2.0<h> // => two hours, typed.
// => Division of units yields the compound unit: km/h needs no declaration.
let speed = distance / duration // => 75.0<km/h>: dimensions divide too.
// => Stripping units is explicit: divide by one unit to read the number.
let kmh = float (speed / 1.0<km/h>) // => 75.0: the bare number, asked for openly.
printfn "speed=%.1f km/h" kmh // => speed=75.0 km/h.
