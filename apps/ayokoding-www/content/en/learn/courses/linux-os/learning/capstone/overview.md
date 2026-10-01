---
title: "Process Tour"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

## Goal

Build `code/process_tour.c`: its parent maps one shared page, creates a pipe, installs a `SIGUSR1` handler, forks a worker, has the worker `exec` a short command, writes a result through the pipe, updates shared memory, signals the parent, and is reaped with `waitpid`.

## Proof checklist

```sh
cc -std=c11 -Wall -Wextra -Werror process_tour.c -o process-tour
./process-tour
strace -f -e trace=process,signal,pipe,mmap ./process-tour
./process-tour & pid=$!
ps -o pid,ppid,stat,cmd -p "$pid"
grep -E 'State|VmRSS' /proc/$pid/status
grep -E '\[anon|rw-p' /proc/$pid/maps | head
wait "$pid"
```

Success means the output names the reaped child, the pipe message, the shared-memory value, and the observed signal. The trace must show process creation/reaping, signal delivery, a pipe read/write, and an anonymous `mmap`; `/proc` and `ps` are evidence while the parent is alive.

```mermaid
sequenceDiagram
  accTitle: Proof checklist
  accDescr: Sequence diagram between Parent, Child. Messages: Parent to Parent: mmap + pipe + sigaction; Parent to Child: fork; Child to Child: exec child action; Child to Parent: pipe write shared page update SIGUSR1; Parent to Parent: pipe read waitpid munmap.
  participant P as Parent
  participant C as Child
  P->>P: mmap + pipe + sigaction
  P->>C: fork
  C->>C: exec child action
  C->>P: pipe write; shared page update; SIGUSR1
  P->>P: pipe read; waitpid; munmap
```

The diagram says the parent owns lifecycle and cleanup; the pipe carries a message, while the mapping carries shared state. Neither replaces `waitpid`.
