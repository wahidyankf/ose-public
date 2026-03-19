---
title: "Overview"
weight: 10000000
date: 2026-03-20T00:00:00+07:00
draft: false
description: "An overview of Git, the distributed version control system used for tracking changes in source code during software development."
tags: ["git", "version-control", "overview"]
---

Git is a distributed version control system that tracks changes in files and coordinates work among multiple people. It enables developers to record the history of a project, branch off to experiment with new features, and merge changes back into the main codebase.

## What Git Solves

Software projects grow in complexity. Without a version control system, teams face challenges such as overwriting each other's work, losing earlier states of code, and having no audit trail of who changed what and why. Git addresses these problems by storing every change as a snapshot, allowing any state to be restored, compared, or branched from.

## Core Concepts

Git organizes work around a few foundational ideas:

- **Repository**: A directory tracked by Git, containing the full project history.
- **Commit**: A saved snapshot of changes, with a message describing what changed and why.
- **Branch**: An independent line of development that diverges from the main history without affecting it.
- **Remote**: A version of the repository hosted elsewhere (such as GitHub or GitLab) for collaboration and backup.
- **Merge and Rebase**: Two strategies for integrating changes from one branch into another.

## What This Section Covers

This section teaches Git through practical, annotated examples. The by-example path provides heavily annotated code samples covering the full Git workflow, from initializing a repository to advanced techniques such as interactive rebase, cherry-picking, bisect, hooks, and worktrees.
