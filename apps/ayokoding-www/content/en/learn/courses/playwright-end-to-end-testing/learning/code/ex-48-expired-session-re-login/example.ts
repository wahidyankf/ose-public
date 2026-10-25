// Example 48: Expired Session Re-Login. (co-12: authentication-state)
// => Playwright 1.60.0, docs accessed 2026-10-20; sessions expire: the
// => setup project detects the stale state (a probe request answers 401),
// => logs in again, and overwrites the file -- the next test never sees the
// => expiry:
// =>   real: if (await probe.status() === 401) { await login(); await state.write(); }
interface Session {
  // => the saved session plus its freshness
  user: string; // => who the state belongs to
  expired: boolean; // => true when the backend would answer 401
} // => Session carries its own expiry signal

async function main(): Promise<void> {
  // => entry point for the expiry check
  let saved: Session = { user: "ada", expired: true }; // => yesterday's state, now stale
  let logins = 0; // => how many fresh logins happened
  saved = ensureFresh(saved, () => {
    logins += 1;
  }); // => probe, then re-login when stale
  console.log("logins: " + String(logins)); // => Output: logins: 1
  console.log("fresh: " + String(!saved.expired)); // => Output: fresh: true
  saved = ensureFresh(saved, () => {
    logins += 1;
  }); // => a fresh session needs no login
  console.log("still one login: " + String(logins === 1)); // => Output: still one login: true
  console.log("expiry handled: " + String(saved.user === "ada" && !saved.expired)); // => Output: expiry handled: true
} // => main ends; the stale session renewed itself once

function ensureFresh(saved: Session, login: () => void): Session {
  // => stand-in for the probe plus conditional login
  if (!saved.expired) {
    // => the probe answered 200: state is fresh
    return saved; // => reuse it untouched
  } // => stale branch below
  login(); // => the probe answered 401: log in again
  return { user: saved.user, expired: false }; // => overwrite the state file with fresh state
} // => ensureFresh renews only when stale

await main(); // => run once; a failure throws and exits nonzero
