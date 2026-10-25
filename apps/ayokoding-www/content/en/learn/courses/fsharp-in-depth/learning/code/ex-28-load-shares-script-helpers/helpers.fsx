// => Shared greeter: one module, one function, loaded by main.fsx.
module Greeter // => the top-level module gives callers an address.
// => greet wraps a name; pure function, no ambient input.
let greet (name: string) = sprintf "hello %s" name // => the single helper.
