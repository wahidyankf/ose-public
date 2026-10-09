// => The record carries a name and a score.
type Player = { Name: string; Score: int }
// => Budi’s score of 10 is higher than Ayu’s 8.
let players = [{ Name = "Ayu"; Score = 8 }; { Name = "Budi"; Score = 10 }]
// => sortByDescending chooses Score as the key.
let ranked = players |> List.sortByDescending (fun player -> player.Score)
// => Budi appears first.
printfn "%s" ranked.Head.Name
