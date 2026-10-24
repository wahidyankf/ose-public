// @vitest-environment jsdom
// => DOM pragma: form submission reads live control values from a document.

import { afterEach, expect, test, vi } from "vitest"; // => Runner plus mocks: the submit callback becomes a recorder.
// => vi joins the imports: the submit spy is this file's first mock function.
// => Spy plus queries: interaction examples now observe calls as well as DOM.

import { cleanup, render, screen } from "@testing-library/react"; // => Render plus queries: mount the form, read it by role.
// => textbox and button roles locate the fields and the submit control.

import "@testing-library/jest-dom/vitest"; // => DOM matchers: call-count and payload assertions.
// => jest-dom matchers stay registered: every UI file keeps the import.

import React, { useState } from "react"; // => State hook: email and password live here.
// => useState holds the two fields: submit reads state, not the DOM directly.

import userEvent from "@testing-library/user-event"; // => Real-event driver: typing behaves like a user, without delay.
// => user-event simulates full interaction sequences, not single raw events.
// => Clicking a submit button runs validation, submit, and reset faithfully.

type Credentials = { email: string; password: string }; // => Payload shape: the typed object submit delivers.
// => Payload type: the spy below will assert this exact shape arrived.

function LoginForm({ onSubmit }: { onSubmit: (c: Credentials) => void }): React.JSX.Element {
  // => The submit handler arrives as a prop: the seam the spy observes.
  // => Props-as-seams keep components testable without routers or stores.
  const [email, setEmail] = useState("");
  // => Empty fields: the test types both before submitting.
  const [password, setPassword] = useState("");
  // => Separate state per field: submit combines them into one payload.
  return (
    <form
      onSubmit={(e) => {
        // => onSubmit on the form catches button clicks AND Enter-key submits.
        e.preventDefault(); // => No reload: submit stays in the test DOM.
        // => preventDefault stops navigation: tests never leave the document.
        onSubmit({ email, password });
        // => One payload object: the contract the spy asserts below.
        // => State read at submit time: fresh values, never stale closures.
      }}
    >
      <label>
        {/* => Wrapping label: Email text associated with the field by nesting. */}
        Email
        {/* => Label text is the textbox name the test queries below. */}
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        {/* => Controlled email field: state mirrors keystrokes exactly. */}
      </label>
      {/* => Email control complete: labeled, controlled, submittable. */}
      <label>
        {/* => Second wrapping label: password associated the same way. */}
        Password
        {/* => Password label text: the query hook for the secret field. */}
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {/* => type password masks display: value still assertable by the spy. */}
        {/* => Controlled like email: both fields flow through state uniformly. */}
      </label>
      {/* => Password control complete: masked on screen, plain in state. */}
      <button type="submit">Sign in</button>
      {/* => type submit wires the button to the form handler automatically. */}
      {/* => Submit button: click here runs the form handler, not a click handler. */}
    </form>
    // => Form closes: fields plus submit, the complete login contract.
  );
  // => Component ends: two state variables, one payload, one spy seam.
}

test("submit delivers both fields in one payload", async () => {
  // => Case name states the data contract: one call, complete payload.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  // => Real timers stay on here: no waiting happens, only event dispatch.
  const onSubmit = vi.fn();
  // => vi.fn() builds a recording spy: no implementation, total recall.
  // => The spy replaces the real handler: no server, no side effects.
  render(<LoginForm onSubmit={onSubmit} />);
  // => Inject the spy as a prop: the component calls it like the real one.
  await user.type(screen.getByRole("textbox", { name: "Email" }), "sari@example.com");
  // => type() fills the email through real keystroke events and onChange.
  await user.type(screen.getByLabelText("Password"), "s3cret!");
  // => Password has no textbox role quirk here: label query reaches it.
  // => Special characters type fine: no escaping needed in user-event strings.
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  // => Clicking submit runs the form handler: the moment the spy observes.
  expect(onSubmit).toHaveBeenCalledTimes(1);
  // => Exactly once: double-submit bugs fail this line before anything else.
  expect(onSubmit).toHaveBeenCalledWith({
    email: "sari@example.com",
    password: "s3cret!",
  });
  // => Payload asserted whole: a missing field fails the object match.
  // => The spy recorded what the user did: data flow proved end to end.
});
