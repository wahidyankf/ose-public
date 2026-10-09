// => The anchors require the whole string to match.
let pattern = System.Text.RegularExpressions.Regex("^[A-Z]{2}[0-9]{2}$")
// => IsMatch returns a Boolean.
let accepted = pattern.IsMatch "AB12"
// => This prints true.
printfn "%b" accepted
