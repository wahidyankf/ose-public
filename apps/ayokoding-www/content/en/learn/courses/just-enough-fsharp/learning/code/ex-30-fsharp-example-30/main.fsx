// => mutable permits assignment to this binding.
let mutable total = 0
// => <- changes the existing binding on each iteration.
for value in [2; 3; 4] do
    // => Assignment updates the existing total for each input value.
    total <- total + value
// => This prints 9.
printfn "%d" total
