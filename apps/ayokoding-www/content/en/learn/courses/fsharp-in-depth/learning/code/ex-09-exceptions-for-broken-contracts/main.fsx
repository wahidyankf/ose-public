// => Example 9: exceptions unwind broken contracts to one deciding boundary.
let divide (x: int) (y: int) = // => the contract: y must not be zero.
    // => Guard the contract up front; the math below assumes it holds.
    if y = 0 then invalidArg "y" "divisor must not be zero" // => blame the argument by name.
    // => Past the guard the division is total: no checks inline.
    else x / y // => the happy path reads straight down.
// => The boundary runs both calls and converts each break into an answer.
let attempt x y = // => one handler for every call through this edge.
    // => try runs the call; with matches only the exceptions named below.
    try sprintf "ok=%d" (divide x y) // => success answers through the same shape.
    // => Typed patterns keep the handler honest about what it catches.
    with :? System.ArgumentException as ex -> sprintf "bad-arg=%s" ex.ParamName // => contract break named.
// => Both calls print: the good quotient and the blamed argument side by side.
printfn "%s | %s" (attempt 10 2) (attempt 10 0) // => ok=5 | bad-arg=y.
