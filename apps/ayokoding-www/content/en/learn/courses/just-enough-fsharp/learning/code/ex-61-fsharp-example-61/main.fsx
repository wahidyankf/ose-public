// => List.tryHead reports only presence or absence.
let firstOrError values =
    // => Check whether the input list has a first item.
    match List.tryHead values with
    // => A present head becomes an Ok value.
    | Some first -> Ok first
    // => An empty list gets an explanatory Error.
    | None -> Error "list is empty"
// => This prints Error "list is empty".
printfn "%A" (firstOrError [])
