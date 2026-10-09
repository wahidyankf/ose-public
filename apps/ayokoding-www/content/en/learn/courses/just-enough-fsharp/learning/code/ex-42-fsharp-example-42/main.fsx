// => None represents the missing preference.
let selected: string option = None
// => defaultValue resolves absence for display.
let label = selected |> Option.defaultValue "Guest"
// => This prints Guest.
printfn "%s" label
