export function greet(name: string, excited = false): string {
  // => Default parameter: one line, TWO branches (default taken or not).
  // => Defaults are branchy by nature: the = false hides a fork.
  const base = name.trim() === "" ? "there" : name;
  // => Ternary: second fork. Empty and blank names share the 'there' branch.
  return excited ? `Hello, ${base}!` : `Hello, ${base}.`;
  // => Third fork on excited: punctuation carries the branch, visibly.
}
