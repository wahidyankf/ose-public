// => Kata 1 starter: stringly failures force callers to parse messages.
let withdraw balance amount = // => two arguments in, remainder or raise out.
    // => Happy path subtracts; the failure path raises a bare message.
    if balance >= amount then balance - amount // => the guard decides value versus raise.
    else failwith (sprintf "need %d have %d" amount balance) // => stringly failure callers must parse.
// => The happy path works; the failing call would raise instead of answering.
printfn "left=%d" (withdraw 100 30) // => prints 70; the raise path stays unprinted.
