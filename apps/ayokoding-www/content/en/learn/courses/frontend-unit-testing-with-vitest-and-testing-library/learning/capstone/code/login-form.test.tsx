// @vitest-environment jsdom
// => DOM pragma: the form renders, labels bind, alerts announce.

import { afterEach, expect, test, vi } from "vitest";
// => Recorder plus assertions: onLogin calls become countable facts.

import { cleanup, render, screen } from "@testing-library/react";
// => Render plus role queries: the form is found the way users find it.

import userEvent from "@testing-library/user-event";
// => Real keystrokes: typing and tabbing behave like a user, not a script.

import "@testing-library/jest-dom/vitest";
// => DOM matchers: disabled, texts, and document assertions read cleanly.

import { LoginForm } from "./login-form";
// => Subject import: the validated form, callback injected per case.

afterEach(() => {
  cleanup();
  // => Unmount: each case starts from a pristine document body.
});

test("blank submit shows both errors and never calls back", async () => {
  // => Validity claim: invalid input blocks the callback AND explains why.
  const onLogin = vi.fn();
  // => Recorder: must stay silent on this path, vocal on the next.
  render(<LoginForm onLogin={onLogin} />);
  // => Mount: empty fields, no errors yet, the blank slate.
  const user = userEvent.setup();
  // => Real-event driver: keyboard and clicks dispatch trusted events.
  await user.click(screen.getByRole("button", { name: "Log in" }));
  // => Submit with blanks: the invalid path, no typing needed.
  const alerts = screen.getAllByRole("alert");
  // => Both alerts: username and password rules fired independently.
  expect(alerts).toHaveLength(2);
  // => Exactly two: one per violated field, no more, no fewer.
  expect(alerts[0]).toHaveTextContent("Username is required");
  // => First alert: username rule fires on empty submit.
  expect(onLogin).not.toHaveBeenCalled();
  // => Callback silent: invalid forms never report credentials.
});

test("short password names the minimum while username passes", async () => {
  // => Independence claim: one field valid does not mask the other's error.
  const onLogin = vi.fn();
  // => Fresh recorder: call counts never leak between cases.
  render(<LoginForm onLogin={onLogin} />);
  // => Mount: same blank slate, different input path.
  const user = userEvent.setup();
  // => Driver per case: setup inside the test, never shared module state.
  await user.type(screen.getByLabelText("Username"), "siti");
  // => Valid username: only the password rule should complain below.
  await user.type(screen.getByLabelText("Password"), "short");
  // => Too-short secret: five characters against a minimum of eight.
  await user.click(screen.getByRole("button", { name: "Log in" }));
  // => Submit: validation runs, exactly one error expected.
  expect(screen.getAllByRole("alert")).toHaveLength(1);
  // => Single alert: username passed, password did not.
  expect(screen.getByRole("alert")).toHaveTextContent("at least 8 characters");
  // => Minimum named: the message carries the number, users can act on it.
  expect(onLogin).not.toHaveBeenCalled();
  // => Still silent: one violation is enough to block the callback.
});

test("valid credentials reach the callback exactly once", async () => {
  // => Happy path: valid input produces one typed payload, no errors.
  const onLogin = vi.fn();
  // => Recorder: this case asserts it fires with the exact object.
  render(<LoginForm onLogin={onLogin} />);
  // => Mount: the form under test, callback wired.
  const user = userEvent.setup();
  // => Real typing: each keystroke flows through the controlled inputs.
  await user.type(screen.getByLabelText("Username"), "siti");
  // => Username: valid, no trimming needed.
  await user.type(screen.getByLabelText("Password"), "correct-horse-8");
  // => Long secret: comfortably past the minimum.
  await user.click(screen.getByRole("button", { name: "Log in" }));
  // => Submit: clean error bag, callback fires.
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  // => No alerts: valid input explains nothing because nothing failed.
  expect(onLogin).toHaveBeenCalledTimes(1);
  // => Exactly once: double submits would fail here by design.
  expect(onLogin).toHaveBeenCalledWith({ username: "siti", password: "correct-horse-8" });
  // => Exact payload: the parent receives what the user typed, verbatim.
});
