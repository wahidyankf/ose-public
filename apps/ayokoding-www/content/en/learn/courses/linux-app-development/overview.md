---
title: "Overview"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

Linux programs are good citizens when they honor arguments, exit codes, streams, files, child processes, and signals. This course applies Python to that operating-system contract.

## Prerequisites

- Complete [Just Enough Python](../just-enough-python/learning/overview.md). It supplies Python syntax, functions, files, errors, and tests; this course does not repeat them.
- Use Linux, WSL, or a Linux VM with Python 3 and a POSIX shell. systemd is needed only for the service-manager exercise.

## What you will build

The learning track has 78 annotated, source-matched examples. The capstone packages a `notes-linux` CLI and Unix-socket daemon with graceful SIGTERM shutdown and pytest tests.

## Scope boundary

This is an application course, not a Python primer or kernel course. Just Enough Python owns language syntax; Linux OS owns the kernel view. This course owns the process, filesystem, IPC, packaging, and service-lifecycle boundary. GTK, Qt, and containers remain surveys, not framework tutorials.
