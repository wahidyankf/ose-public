// => Kata 7 starter: sequential awaits serialize independent work.
export async function loadAll(ids: string[]): Promise<string[]> {
  // => BUG: waits per id in turn
  const out: string[] = []; // => collected rows
  for (const id of ids) {
    // => each iteration waits for the last
    out.push(await Promise.resolve(`row:${id}`)); // => independent work, serialized
  } // => end of for (const id of ids)
  return out; // => correct values, wasted time
} // => end of export async function loadAll(ids: string[]): Promis
