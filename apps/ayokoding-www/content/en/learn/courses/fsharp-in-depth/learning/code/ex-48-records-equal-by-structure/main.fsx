// => Example 48: three points compared by structure, not by identity.
type Point = { X: int; Y: int } // => the value shape: two coordinates.
// => Two separately built points with identical fields.
let p1 = { X = 3; Y = 4 } // => first construction.
let p2 = { X = 3; Y = 4 } // => second construction, same fields.
// => A third point differing in one coordinate.
let p3 = { X = 3; Y = 5 } // => near miss on Y.
// => Structural equality: fields decide, construction history does not.
let same = p1 = p2 // => true: same fields, different constructions.
let diff = p1 = p3 // => false: Y differs.
printfn "same=%b diff=%b" same diff // => same=true diff=false.
