// => Example 37 file 1: a tiny roster with add and list.
export class Roster {
  // => in-memory roster under test
  private members: string[] = []; // => hidden state, the fixture resets it
  add(who: string): void {
    // => adds one member
    this.members.push(who); // => append only
  } // => end of add(who: string): void
  list(): string[] {
    // => snapshot in insertion order
    return [...this.members]; // => WHY copy: callers cannot mutate state
  } // => end of list(): string[]
} // => end of export class Roster
