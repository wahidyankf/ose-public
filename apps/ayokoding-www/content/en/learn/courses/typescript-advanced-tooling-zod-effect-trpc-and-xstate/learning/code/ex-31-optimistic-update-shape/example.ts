// => Worked Example 31: the optimistic update wears the procedure's output type.
// => co-06: the UI guesses with the same shape the server will confirm, so reconciliation is trivial.
interface Todo {
  // => the shared output shape: server, cache, and optimistic guess all use it
  id: string; // => real ids from the server, temp ids from the client
  title: string; // => the todo text
  done: boolean; // => new todos start undone
}
function optimisticTodo(title: string): Todo {
  // => the instant UI guess: same shape as the server reply, temp id
  return { id: "temp_" + title.length, title: title, done: false }; // => renders before the server answers
}
function serverTodo(title: string): Todo {
  // => the server confirmation: same shape, real id
  return { id: "todo_42", title: title, done: false }; // => authoritative reply
}
function reconcile(guess: Todo, confirmed: Todo): string {
  // => reconciliation: same shape in, one swap decision out
  if (guess.title === confirmed.title && guess.done === confirmed.done) {
    // => everything but the id matches: swap the temp id for the real one
    return "swap " + guess.id + " -> " + confirmed.id; // => id replacement only
  } // => content differs: fall through to the conflict path
  return "conflict: keep server"; // => the server wins content disputes
}
function main(): void {
  // => entry point; guess, confirm, and reconcile one todo
  // => the UI renders the guess instantly while the request flies
  const guess: Todo = optimisticTodo("Buy milk"); // => instant, temp-id todo
  console.log("guess: id=" + guess.id + " title=" + guess.title); // => Output: guess: id=temp_8 title=Buy milk
  // => the server reply arrives with the same shape and a real id
  const confirmed: Todo = serverTodo("Buy milk"); // => authoritative todo
  console.log("confirmed: id=" + confirmed.id); // => Output: confirmed: id=todo_42
  // => reconciliation swaps the id because the shared shape makes comparison trivial
  console.log(reconcile(guess, confirmed)); // => Output: swap temp_8 -> todo_42
}
main(); // => run once; a throw exits nonzero
