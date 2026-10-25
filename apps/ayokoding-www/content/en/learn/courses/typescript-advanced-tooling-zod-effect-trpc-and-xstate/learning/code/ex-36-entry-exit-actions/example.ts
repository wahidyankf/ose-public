// => Worked Example 36: entry and exit actions run side effects at state edges.
// => co-10: in XState this is entry: and exit: plus assign: effects and context updates on transitions.
interface Player {
  // => the player context: the track and whether sound is audible
  track: string; // => currently loaded track
  volume: number; // => 0 means muted
}
type PlayerState = "stopped" | "playing"; // => audible only while playing
interface Log {
  // => the action log: every side effect the machine performed, in order
  entries: string[]; // => tests assert on this instead of on speakers
}
// => Arrival sets up: unmute plus volume restore, recorded for the test.
function enterPlaying(context: Player, log: Log): Player {
  // => the entry action for playing: unmute and announce
  log.entries.push("enter playing: unmute"); // => side effect recorded
  return { track: context.track, volume: 80 }; // => assign: volume restored
}
function exitPlaying(log: Log): void {
  // => the exit action for playing: announce the stop
  log.entries.push("exit playing: fade out"); // => side effect recorded
}
// => PLAY is one edge: run the entry action, then occupy the state.
function play(context: Player, log: Log): { state: PlayerState; context: Player } {
  // => the PLAY transition: exit nothing, enter playing
  const next: Player = enterPlaying(context, log); // => entry action runs on arrival
  return { state: "playing", context: next }; // => playing with restored volume
}
function stop(context: Player, log: Log): { state: PlayerState; context: Player } {
  // => the STOP transition: exit playing, no entry for stopped
  exitPlaying(log); // => exit action runs on departure
  return { state: "stopped", context: { track: context.track, volume: 0 } }; // => assign: muted
}
function main(): void {
  // => entry point; play then stop, and the log proves the edge order
  // => entry first, exit on departure: the log must read in that order.
  // => starting stopped and muted, the PLAY transition enters playing
  const log: Log = { entries: [] }; // => fresh action log
  const context: Player = { track: "anthem", volume: 0 }; // => stopped and muted
  const playing = play(context, log); // => PLAY: entry runs
  console.log("playing: state=" + playing.state + " volume=" + String(playing.context.volume)); // => Output: playing: state=playing volume=80
  // => the STOP transition exits playing: exit runs before the state changes
  const stopped = stop(playing.context, log); // => STOP: exit runs
  console.log("stopped: state=" + stopped.state + " log=" + log.entries.join(" | ")); // => Output: stopped: state=stopped log=enter playing: unmute | exit playing: fade out
}
main(); // => run once; a throw exits nonzero
