// => Example 75: a stack agent read as state plus protocol.
type StackMsg = Push of int | Pop of AsyncReplyChannel<int option> | Peek of AsyncReplyChannel<int option> // => the protocol.
// => The loop argument holds the whole state: a plain list as a stack.
let stack = MailboxProcessor.Start(fun box -> async { // => the agent starts here.
    let rec loop items = async { // => items are the state; arms transition it.
        // => One arm per protocol case: update or reply, then loop.
        let! msg = box.Receive() // => the next protocol message arrives.
        match msg with // => each case transitions or answers.
        | Push v -> return! loop (v :: items) // => push extends the state.
        | Pop reply -> // => pop answers the head, or None when empty.
            match items with // => the empty stack is a case, not a crash.
            | [] -> reply.Reply(None); return! loop [] // => empty answers None.
            | h :: t -> reply.Reply(Some h); return! loop t // => head answers, tail loops.
        | Peek reply -> // => peek answers without transitioning.
            reply.Reply(List.tryHead items); return! loop items } // => state unchanged.
    return! loop [] }) // => the empty stack starts the machine.
// => Push two, peek, pop twice: the transcript walks the protocol.
stack.Post(Push 7) // => state becomes [7].
stack.Post(Push 8) // => state becomes [8; 7].
let peeked = stack.PostAndReply(fun ch -> Peek ch) // => Some 8: head without popping.
let p1 = stack.PostAndReply(fun ch -> Pop ch) // => Some 8: head leaves.
let p2 = stack.PostAndReply(fun ch -> Pop ch) // => Some 7: next leaves.
let show o = match o with Some v -> sprintf "%d" v | None -> "empty" // => option renderer.
printfn "peek=%s pop1=%s pop2=%s" (show peeked) (show p1) (show p2) // => peek=8 pop1=8 pop2=7.
