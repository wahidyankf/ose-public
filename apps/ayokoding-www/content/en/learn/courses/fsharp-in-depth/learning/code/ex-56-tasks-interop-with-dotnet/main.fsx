// => Example 56: two tasks awaited in task, joined through async.
open System.Threading.Tasks // => FromResult and Task live here.
// => Two BCL tasks with fixed results: the boundary input, already complete.
let t1 = Task.FromResult(20) // => first completed task.
let t2 = Task.FromResult(22) // => second completed task.
// => task speaks the .NET protocol: let! awaits without blocking threads.
let combined = task { // => the task plan, cold until awaited.
    // => Await each task in turn; both are complete, order is fixed.
    let! a = t1 // => 20 out of the first task.
    let! b = t2 // => 22 out of the second task.
    // => The joined answer leaves the task world as one number.
    return a + b } // => 42: the combined result.
// => Convert once at the edge: the runner below speaks async uniformly.
let total = Async.AwaitTask combined |> Async.RunSynchronously // => 42.
printfn "total=%d" total // => total=42.
