// => Async loading widget: loading, list, and error states from one promise.
// => Injected fetcher: the component never touches the network, tests inject.
import React, { useEffect, useState } from "react";
// => Effect plus state: fetch on mount, render whatever the promise settles.

// => Fetcher shape: resolves names, rejects with the failure the UI shows.
export type FetchUsers = () => Promise<string[]>;

// => Props shape: the loader's only dependency, trivially mockable.
export interface UserLoaderProps {
  fetchUsers: FetchUsers;
}

// => Loader states: loading first, then users or a message, never both.
export function UserLoader({ fetchUsers }: UserLoaderProps): React.JSX.Element {
  // => Destructured fetcher: stable per render, effect depends on it once.
  const [users, setUsers] = useState<string[] | null>(null);
  // => Null means pending: the loading text owns the first paint.
  const [error, setError] = useState<string | null>(null);
  // => Error state: rejection message lands here for the alert to read.

  useEffect(() => {
    // => Mount effect: exactly one fetch per mount in this widget.
    let alive = true;
    // => Alive flag: unmounted loaders discard late settlements, no warnings.
    fetchUsers().then(
      (names) => {
        if (alive) setUsers(names);
      },
      // => Success path: names replace the loading text wholesale.
      (cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : "Load failed");
      },
      // => Failure path: Error messages surface, exotic rejections get a default.
    );
    return () => {
      alive = false;
    };
    // => Cleanup flips the flag: settled-after-unmount updates never fire.
  }, [fetchUsers]);
  // => Dependency honest: lint-clean and remount-safe if the fetcher changes.

  if (error !== null) return <p role="alert">{error}</p>;
  // => Error first: an alert the suite finds by role, text asserted separately.
  if (users === null) return <p>Loading users…</p>;
  // => Loading text: the placeholder findBy replaces once names arrive.
  return (
    // => Settled list: real markup, one item per fetched name.
    <ul>
      {users.map((name) => (
        <li key={name}>{name}</li>
        // => Name keys: fixture names are unique, keys stay stable.
      ))}
    </ul>
  );
}
