// => A dollar-prefixed string interpolates the name.
let name = "Ayu"
// => The expression inside braces supplies the value.
let message = $"Hello, {name}!"
// => The result is Hello, Ayu!.
printfn "%s" message
