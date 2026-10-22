// => Example 17: four failures walk in; each leaves by its own door.
let table = Map.ofList [ ("port", "8080") ] // => the fixed table: one known key.
// => Absence: the caller branches, so Option carries the miss.
let host = Map.tryFind "host" table |> Option.defaultValue "localhost" // => None falls back.
// => Handled fault: the parse may fail, so Result carries the complaint.
let port = // => parse the known key through the total attempt.
    match System.Int32.TryParse(Map.find "port" table) with // => the key exists by construction.
    | true, n -> Ok n // => digits ride Ok.
    | false, _ -> Error "bad port" // => garbage would ride Error.
// => Broken contract: zero page size is a caller bug, so it raises.
let page size = if size <= 0 then invalidArg "size" "page size must be positive" else size // => guard up front.
// => The boundary catches the contract break; values flow through matches.
let sizeText = try sprintf "%d" (page 25) with :? System.ArgumentException -> "bad-size" // => valid size prints.
let portText = match port with Ok n -> sprintf "%d" n | Error m -> m // => parse result renders.
printfn "host=%s port=%s size=%s" host portText sizeText // => host=localhost port=8080 size=25.
