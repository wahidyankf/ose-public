// => Example 58: one event, two subscribers, three triggers in order.
let reading = Event<int>() // => the broadcast: integer readings go out here.
// => Subscriber one collects every payload in arrival order.
let seen = ResizeArray<int>() // => the local buffer, trigger order preserved.
reading.Publish.Add(fun v -> seen.Add(v)) // => append on every trigger.
// => Subscriber two counts arrivals independently of the collector.
let mutable count = 0 // => the arrival counter, local to this script.
reading.Publish.Add(fun _ -> count <- count + 1) // => count on every trigger.
// => Three fixed triggers: synchronous, ordered, no threads involved.
reading.Trigger(10) // => first reading out to both subscribers.
reading.Trigger(20) // => second reading out to both subscribers.
reading.Trigger(30) // => third reading out to both subscribers.
// => Buffer order matches trigger order; the counter matches the count.
printfn "seen=%A count=%d" (seen |> Seq.toList) count // => seen=[10; 20; 30] count=3.
