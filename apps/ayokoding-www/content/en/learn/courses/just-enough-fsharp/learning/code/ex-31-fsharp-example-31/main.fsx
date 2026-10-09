// => None drops an odd value; Some keeps a doubled even value.
let transformed =
    // => Only four concrete integers enter the transformation.
    [1; 2; 3; 4]
    // => Even numbers become doubled Some values; odd numbers become None.
    |> List.choose (fun value -> if value % 2 = 0 then Some(value * 2) else None)
// => This prints [4; 8].
printfn "%A" transformed
