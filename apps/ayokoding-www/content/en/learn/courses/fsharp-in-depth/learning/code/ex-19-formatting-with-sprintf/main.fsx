// => Example 19: one summary formatted two checked ways.
let item = "engine" // => the fixed item name both formats share.
let qty = 3 // => the fixed quantity both formats share.
let price = 19.995 // => the fixed unit price both formats share.
// => sprintf carries checked placeholders the compiler verifies.
let viaSprintf = sprintf "%d x %s @ %.2f" qty item price // => 3 x engine @ 20.00.
// => Interpolation embeds values directly; preformat numbers to keep control.
let priceText = sprintf "%.2f" price // => the rounded price text both share.
let viaInterp = $"{qty} x {item} @ {priceText}" // => same text, nearer values.
// => Both routes agree byte for byte: pick by readability, not by output.
let same = viaSprintf = viaInterp // => true: the two spellings coincide.
printfn "%s | same=%b" viaSprintf same // => 3 x engine @ 20.00 | same=true.
