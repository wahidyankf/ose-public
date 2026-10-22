// => Example 13: errors as data — a union case per failure with fields.
type WithdrawError = // => every way a withdrawal can fail, named with context.
    | Insufficient of balance: int * amount: int * short: int // => the shortfall facts.
    | ClosedAccount of account: string // => a closed account names itself.
// => The operation answers Result with the union as its Error side.
let withdraw balance amount = // => balance and amount in, tagged outcome out.
    // => Arithmetic decides; the failure case keeps every fact as a field.
    if amount <= balance then Ok (balance - amount) // => happy path: remainder.
    else Error (Insufficient (balance, amount, amount - balance)) // => facts, not prose.
// => Handlers match cases and read fields; strings form only for display.
let render outcome = // => render at the edge where humans read.
    match outcome with // => one arm per outcome, compiler-checked.
    | Ok left -> sprintf "left=%d" left // => success prints the remainder.
    | Error (Insufficient (b, a, s)) -> sprintf "short=%d balance=%d amount=%d" s b a // => fields read out.
    | Error (ClosedAccount acc) -> sprintf "closed=%s" acc // => the other case covered.
printfn "%s | %s" (render (withdraw 100 30)) (render (withdraw 10 30)) // => left=70 | short=20 balance=10 amount=30.
