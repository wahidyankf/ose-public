// => Worked Example 40: parallel regions track independent concerns at once.
// => co-09: in XState this is type: "parallel" with regions: playback and captions advance together.
interface MediaSnapshot {
  // => the parallel snapshot: one substate per region, side by side
  playback: "playing" | "paused"; // => the playback region
  captions: "on" | "off"; // => the captions region
}
type MediaEvent = { type: "PLAY" } | { type: "PAUSE" } | { type: "CAPTIONS_ON" } | { type: "CAPTIONS_OFF" }; // => region-scoped events
function mediaNext(current: MediaSnapshot, event: MediaEvent): MediaSnapshot {
  // => each event touches exactly one region; the other region carries over
  if (event.type === "PLAY") {
    // => playback region moves, captions region untouched
    return { playback: "playing", captions: current.captions }; // => play
  } // => PLAY done
  if (event.type === "PAUSE") {
    // => playback region moves, captions region untouched
    return { playback: "paused", captions: current.captions }; // => pause
  } // => PAUSE done
  if (event.type === "CAPTIONS_ON") {
    // => captions region moves, playback region untouched
    return { playback: current.playback, captions: "on" }; // => captions on
  } // => CAPTIONS_ON done
  if (event.type === "CAPTIONS_OFF") {
    // => captions region moves, playback region untouched
    return { playback: current.playback, captions: "off" }; // => captions off
  } // => every event handled: no fallthrough needed
  return current; // => unreachable, but total: every input maps to a snapshot
}
function main(): void {
  // => entry point; play, enable captions, pause: regions move independently
  // => starting paused without captions, PLAY moves only the playback region
  let snapshot: MediaSnapshot = { playback: "paused", captions: "off" }; // => initial regions
  snapshot = mediaNext(snapshot, { type: "PLAY" }); // => playback moves
  console.log("playing: " + snapshot.playback + "," + snapshot.captions); // => Output: playing: playing,off
  // => CAPTIONS_ON moves only the captions region; PAUSE moves only playback back
  snapshot = mediaNext(snapshot, { type: "CAPTIONS_ON" }); // => captions move
  snapshot = mediaNext(snapshot, { type: "PAUSE" }); // => playback moves back
  console.log("paused: " + snapshot.playback + "," + snapshot.captions); // => Output: paused: paused,on
}
main(); // => run once; a throw exits nonzero
