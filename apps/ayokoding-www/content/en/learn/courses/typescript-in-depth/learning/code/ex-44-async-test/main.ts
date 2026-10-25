// => Example 44 file 1: an async loader with fixed rows plus a fixed failure.
export interface Row {
  // => the loaded shape
  id: number; // => row key
} // => end of export interface Row
export function loadRows(): Promise<Row[]> {
  // => WHY async: real loaders await I/O
  return Promise.resolve([{ id: 1 }, { id: 2 }]); // => fixed rows, no waiting
} // => end of export function loadRows(): Promise<Row[]>
export function loadClosed(): Promise<Row[]> {
  // => a loader that always fails
  return Promise.reject(new Error("loader closed")); // => fixed failure
} // => end of export function loadClosed(): Promise<Row[]>
