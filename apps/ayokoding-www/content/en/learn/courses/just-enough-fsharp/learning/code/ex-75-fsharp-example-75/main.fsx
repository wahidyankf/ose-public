// => A small pure function has one clear contract.
let double value = value * 2
// => An assertion fails the script when the value is wrong.
assert (double 4 = 8)
// => Reaching this line means the check passed.
printfn "passed"
