// => Validated login form: required username, minimum-length password, typed submit.
// => No network: the parent decides what onLogin does; the form only validates.
import React, { useState } from "react";
// => State hook: field values plus the error strings the assertions read.

// => Credentials shape: the typed payload the submit callback receives.
export interface Credentials {
  username: string;
  password: string;
}

// => Props shape: one callback, called only with valid credentials.
export interface LoginFormProps {
  onLogin: (creds: Credentials) => void;
}

// => Minimum password length: the rule the error text and the tests share.
export const MIN_PASSWORD_LENGTH = 8;

// => Validated form: errors render beside fields, submit stays honest.
export function LoginForm({ onLogin }: LoginFormProps): React.JSX.Element {
  // => Props destructure: the single callback the form reports through.
  const [username, setUsername] = useState("");
  // => Field state: controlled inputs keep every keystroke assertable.
  const [password, setPassword] = useState("");
  // => Password state: separate so each field validates independently.
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  // => Error state: absent keys mean valid, present keys render messages.

  const submit = (event: React.FormEvent): void => {
    // => Submit handler: preventDefault first, navigation never happens in tests.
    event.preventDefault();
    // => No page reload: jsdom has no navigation target worth reaching.
    const next: { username?: string; password?: string } = {};
    // => Fresh error bag: every submit revalidates from scratch, no staleness.
    if (username.trim() === "") next.username = "Username is required";
    // => Blank rule: whitespace-only counts as missing, a real-user edge.
    if (password.length < MIN_PASSWORD_LENGTH)
      next.password = `Password needs at least ${MIN_PASSWORD_LENGTH} characters`;
    // => Length rule: the constant appears in text so tests can import the number.
    setErrors(next);
    // => Errors render: state update flushes before the assertions below run.
    if (Object.keys(next).length === 0) onLogin({ username, password });
    // => Valid only: the callback fires exclusively on a clean error bag.
  };

  return (
    // => Native form: submit event plus accessible labels for free.
    <form onSubmit={submit} noValidate>
      {/* => noValidate: the suite tests OUR rules, not the browser's built-ins. */}
      <label htmlFor="cap-username">Username</label>
      {/* => Explicit label: the query the tests anchor on, operable by readers. */}
      <input id="cap-username" value={username} onChange={(event) => setUsername(event.target.value)} />
      {/* => Controlled input: value mirrors state, change writes it back. */}
      {errors.username !== undefined && <p role="alert">{errors.username}</p>}
      {/* => Alert role: errors announce to assistive tech AND to getByRole. */}
      <label htmlFor="cap-password">Password</label>
      {/* => Second label: each field owns its accessible name. */}
      <input id="cap-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {/* => Password type: masked display, same change plumbing as username. */}
      {errors.password !== undefined && <p role="alert">{errors.password}</p>}
      {/* => Second alert: independent error, independent assertion. */}
      <button type="submit">Log in</button>
      {/* => Submit button: the click target every case drives. */}
    </form>
  );
}
