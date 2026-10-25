// => Example 28: main.fsx loads its helper and greets through it.
#load "helpers.fsx" // => the sibling file joins this script at this line.
// => Greeter comes from the loaded file; main.fsx owns the transcript.
let first = Greeter.greet "ada" // => hello ada: loaded function, local data.
let second = Greeter.greet "grace" // => second call proves reuse, not a one-off.
printfn "%s | %s" first second // => hello ada | hello grace.
