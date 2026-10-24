// => Example 5: map, filter, and fold each answer a new value.
let scores = [ 72; 95; 58; 88 ] // => the fixed roster every pass below reads.
// => map changes every element; the shape of the list stays the same.
let curved = List.map (fun s -> s + 5) scores // => every score rises by five.
// => filter keeps passers only; positions of survivors are preserved.
let passing = List.filter (fun s -> s >= 60) scores // => the 58 drops out.
// => fold threads an accumulator: seed first, folder takes acc then element.
let total = List.fold (fun acc s -> acc + s) 0 scores // => 72+95+58+88.
// => The input prints unchanged: transforms never mutate in F#.
printfn "curved=%A passing=%A total=%d kept=%A" curved passing total scores // => curved=[77; 100; 63; 93] passing=[72; 95; 88] total=313 kept=[72; 95; 58; 88].
