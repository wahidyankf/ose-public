module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 2: add a nullable handle column to seeded k2_users, then backfill it from name; prove handles and completeness.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
