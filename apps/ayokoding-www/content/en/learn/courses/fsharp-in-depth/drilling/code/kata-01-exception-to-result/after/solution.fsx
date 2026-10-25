// => Kata 1 solution: tagged shortfalls carry context as data, not prose.
type Shortfall = { Balance: int; Amount: int; Short: int } // => the failure facts as fields.
let withdraw balance amount = // => same shape as the starter, Result instead of raise.
    // => Compare first; both branches return the same tagged shape.
    if balance >= amount then Ok (balance - amount) // => happy path wraps the remainder.
    else Error { Balance = balance; Amount = amount; Short = amount - balance } // => facts, not prose.
// => The happy path prints through the same match the failure path uses.
let show o = match o with Ok left -> sprintf "left=%d" left | Error s -> sprintf "short=%d balance=%d amount=%d" s.Short s.Balance s.Amount // => one renderer.
printfn "%s" (show (withdraw 100 30)) // => left=70 through the match.
printfn "%s" (show (withdraw 10 30)) // => short=20 balance=10 amount=30.
