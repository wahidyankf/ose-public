// => Example 57: a counter agent answering three requests in order.
type CounterMsg = Add of int * AsyncReplyChannel<int> // => increment plus the reply address.
// => The agent owns its count: reachable only through the inbox, one message at a time.
let agent = MailboxProcessor.Start(fun inbox -> async { // => the agent starts with the loop.
    // => Loop carries the count as an argument: no mutable cells anywhere.
    let rec loop count = async { // => count in, next loop iteration out.
        // => Receive one message; the agent sleeps until one arrives.
        let! (Add (n, reply)) = inbox.Receive() // => the next request, destructured.
        // => Reply the new total, then loop with the updated count.
        reply.Reply(count + n) // => the requester unblocks with the answer.
        return! loop (count + n) } // => state threads forward, never shared.
    // => Start counting from zero.
    return! loop 0 }) // => the loop begins.
// => Three sequential requests: each answer depends on the last, order fixed.
let r1 = agent.PostAndReply(fun ch -> Add (1, ch)) // => 1: zero plus one.
let r2 = agent.PostAndReply(fun ch -> Add (2, ch)) // => 3: one plus two.
let r3 = agent.PostAndReply(fun ch -> Add (3, ch)) // => 6: three plus three.
printfn "counts=%d,%d,%d" r1 r2 r3 // => counts=1,3,6.
