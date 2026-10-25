// => Kata 5 solution: one fold counts the passers with no mutable cell.
let scores = [ 72; 95; 58; 88 ] // => the same fixed roster.
// => The folder takes the count first and the score second; seed zero starts it.
let passing = List.fold (fun acc s -> if s >= 60 then acc + 1 else acc) 0 scores // => 3 passers.
// => Same transcript as the starter: the count survived, the cell did not.
printfn "passing=%d" passing // => passing=3, counted immutably.
