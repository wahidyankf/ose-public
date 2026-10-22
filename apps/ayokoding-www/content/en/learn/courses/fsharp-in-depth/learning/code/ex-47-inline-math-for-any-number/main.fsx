// => Example 47: one squaring for three numeric types, one average call.
let inline square x = x * x // => inline stamps a copy per numeric type.
// => Three call sites, three specializations, one definition.
let si = square 7 // => ints: 49.
let sf = square 2.5 // => floats: 6.25.
let sm = square 3M // => decimals: exact money math.
// => List.average divides generically across the types that divide.
let af = List.average [ 1.0; 2.0; 4.0 ] // => floats: 7.0 divided by 3.
let am = List.average [ 1M; 2M; 3M ] // => decimals: exact money average.
printfn "sq=%d,%.2f,%M avg=%.3f,%M" si sf sm af am // => sq=49,6.25,9 avg=2.333,2.
