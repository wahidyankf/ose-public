// => The constructor accepts a name.
type Greeter(name: string) =
    // => Each Greeter uses the name captured by its own constructor.
    member _.Greet() = $"Hello, {name}"
// => Create an instance and call its method.
let greeter = Greeter("Ayu")
// => This prints Hello, Ayu.
printfn "%s" (greeter.Greet())
