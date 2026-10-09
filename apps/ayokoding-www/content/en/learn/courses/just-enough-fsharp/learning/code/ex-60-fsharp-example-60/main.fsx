// => Parsing produces Result rather than silently dropping errors.
let parse (text: string) =
    // => TryParse separates valid integer text from invalid text.
    match System.Int32.TryParse text with
    // => A valid item becomes Ok with its integer value.
    | true, value -> Ok value
    // => Invalid text retains the rejected text in an Error.
    | false, _ -> Error $"invalid integer: {text}"
// => Fold from right to keep the original order.
let sequence results =
    // => Fold the result list from right to left.
    results |> List.foldBack (fun item state ->
        // => Compare the current item with the accumulated state.
        match item, state with
        // => Prepend a successful value to the successful tail.
        | Ok value, Ok values -> Ok(value :: values)
        // => An error in the current item becomes the batch error.
        | Error error, _ -> Error error
        // => An error already in the tail passes through unchanged.
        | _, Error error -> Error error) <| Ok []
// => This prints Ok [2; 3].
printfn "%A" (["2"; "3"] |> List.map parse |> sequence)
