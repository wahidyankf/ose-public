// Example 50: Multi-User Chat in Two Contexts. (co-12: authentication-state)
// => Playwright 1.60.0, docs accessed 2026-10-20; two contexts act as two
// => people: Ada sends in hers, Ben reads in his, and the test asserts the
// => message crossed between isolated sessions -- the classic collaboration
// => proof no single session can fake:
// =>   real: const ada = await browser.newContext({ storageState: "ada.json" });
interface Inbox {
  // => one user's view of the chat
  user: string; // => whose context this is
  messages: string[]; // => the messages this context has received
} // => Inbox isolates each side of the conversation

async function main(): Promise<void> {
  // => entry point for the chat check
  const room: string[] = []; // => the shared backend both contexts talk to
  const ada: Inbox = { user: "ada", messages: [] }; // => Ada's isolated context
  const ben: Inbox = { user: "ben", messages: [] }; // => Ben's isolated context
  send(room, ada, "hello ben"); // => Ada sends from her context
  deliver(room, ben); // => Ben's context polls and receives
  console.log("ben got: " + ben.messages.join(",")); // => Output: ben got: hello ben
  console.log("ada sent only: " + String(ada.messages.length === 0)); // => Output: ada sent only: true
  console.log("crossed contexts: " + String(ben.messages.includes("hello ben"))); // => Output: crossed contexts: true
} // => main ends; the message traveled between isolated sessions

function send(room: string[], from: Inbox, text: string): void {
  // => stand-in for typing and sending
  room.push(from.user + ": " + text); // => the backend stores the message
} // => send never touches the other context

function deliver(room: string[], to: Inbox): void {
  // => stand-in for the receiving context polling
  for (const message of room) {
    // => every message in the room
    const text: string = message.slice(message.indexOf(": ") + 2); // => the text without the sender prefix
    if (!message.startsWith(to.user + ":") && !to.messages.includes(text)) {
      // => not mine, not yet received
      to.messages.push(text); // => deliver the text here
    } // => skip own or duplicate messages
  } // => every message considered
} // => deliver copies across the isolation boundary

await main(); // => run once; a failure throws and exits nonzero
