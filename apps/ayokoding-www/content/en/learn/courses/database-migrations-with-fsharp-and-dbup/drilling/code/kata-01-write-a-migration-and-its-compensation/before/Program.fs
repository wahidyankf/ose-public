module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 1: create k1_posts with a title, add a subtitle column, then compensate by dropping it; prove cols and history.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
