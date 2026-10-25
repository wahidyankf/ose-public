// => Task list: add, toggle, delete, and an honest empty state.
// => Local state only: no store, no props except the seed the tests control.
import React, { useState } from "react";
// => State hook: the task array plus the draft input text.

// => Task shape: numeric id, label text, done flag the checkbox mirrors.
export interface Task {
  id: number;
  label: string;
  done: boolean;
}

// => Seed shape: the list starts exactly where the test puts it.
export interface TaskListProps {
  initial?: Task[];
}

// => Next id seed: deterministic ids keep every snapshot-free assertion exact.
let nextId = 1000;

// => resetIds: tests restart the counter so ids never leak between cases.
export function resetIds(): void {
  nextId = 1000;
}

// => Task list: add form on top, labelled checkboxes below, delete per row.
export function TaskList({ initial = [] }: TaskListProps): React.JSX.Element {
  // => Default seed: empty means the empty-state text renders first.
  const [tasks, setTasks] = useState<Task[]>(initial);
  // => Task state: seeded from props once, owned locally after mount.
  const [draft, setDraft] = useState("");
  // => Draft state: the input mirrors it, add consumes and clears it.

  const add = (event: React.FormEvent): void => {
    // => Add handler: blank drafts are ignored, whitespace included.
    event.preventDefault();
    // => No reload: same form discipline as the login capstone piece.
    const label = draft.trim();
    // => Trim once: stored labels never carry accidental padding.
    if (label === "") return;
    // => Blank guard: the suite asserts nothing was added for empty input.
    nextId += 1;
    // => Fresh id: monotonic, deterministic after resetIds in test setup.
    setTasks([...tasks, { id: nextId, label, done: false }]);
    // => Append immutable: new array, new row unchecked by construction.
    setDraft("");
    // => Clear draft: the input empties, ready for the next task.
  };

  return (
    // => Section landmark: the suite scopes queries here when pages grow.
    <section aria-label="Tasks">
      {/* => Accessible name: within() can target this region by name. */}
      {tasks.length === 0 && <p>No tasks yet — add one above.</p>}
      {/* => Empty state: the first render of an unseeded list, asserted. */}
      <form onSubmit={add}>
        {/* => Add form: submit adds, the same event shape users trigger. */}
        <label htmlFor="cap-task">New task</label>
        {/* => Labelled input: getByLabelText finds it without a test id. */}
        <input
          id="cap-task"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="e.g. review coverage"
        />
        {/* => Placeholder hint: decorative only, never the query anchor. */}
        <button type="submit">Add</button>
        {/* => Add button: click and keyboard submit both reach add(). */}
      </form>
      <ul>
        {/* => Real list markup: semantics screen readers already understand. */}
        {tasks.map((task) => (
          // => Keyed rows: stable ids, no index keys, no reorder bugs.
          <li key={task.id}>
            {/* => Row groups one checkbox, one label, one delete button. */}
            <input
              type="checkbox"
              id={`cap-task-${task.id}`}
              checked={task.done}
              onChange={() => setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))}
            />
            {/* => Toggle writes a new array: immutable update, React re-renders. */}
            <label htmlFor={`cap-task-${task.id}`}>{task.label}</label>
            {/* => Label wraps the text: clicking it toggles, users expect that. */}
            <button
              type="button"
              aria-label={`Delete ${task.label}`}
              onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
            >
              Delete
            </button>
            {/* => Named delete: duplicate Delete texts disambiguate by label. */}
          </li>
        ))}
      </ul>
    </section>
  );
}
