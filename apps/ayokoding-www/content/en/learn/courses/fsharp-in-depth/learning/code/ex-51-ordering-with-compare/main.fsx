// => Example 51: one key ranks three runners through three functions.
type Runner = { Name: string; Time: float } // => the ranked shape.
// => The fixed field: three runners, three times.
let field = [ { Name = "lin"; Time = 12.4 }; { Name = "ada"; Time = 11.9 }; { Name = "grace"; Time = 12.4 } ] // => a tie for second.
// => One key everywhere: time decides, name breaks ties alphabetically.
let key r = (r.Time, r.Name) // => the single ordering both functions share.
// => sortBy orders the table; minBy names the winner on the same key.
let table = List.sortBy key field |> List.map (fun r -> r.Name) // => [ada; grace; lin].
let winner = List.minBy key field // => ada: the fastest time.
// => compare settles head-to-head on the same key the table used.
let duel = compare (key field.[0]) (key field.[2]) // => lin versus grace: ties break by name.
printfn "table=%A winner=%s duel=%d" table winner.Name duel // => table=["ada"; "grace"; "lin"] winner=ada duel=1.
