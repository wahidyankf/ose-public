---
title: "Overview"
weight: 10000000
date: 2026-04-01T00:00:00+07:00
draft: false
---

GitHub CLI (`gh`) is an official command-line tool that brings GitHub functionality directly into
your terminal. It lets you manage repositories, issues, pull requests, releases, gists, GitHub
Actions workflows, and more without leaving the shell — enabling scripting, automation, and
faster developer workflows.

## What GitHub CLI Provides

`gh` wraps the GitHub REST and GraphQL APIs in a developer-friendly command-line interface. It
authenticates once via OAuth or a personal access token, then provides a consistent command
structure across all GitHub resource types. The tool ships as a single binary with no runtime
dependencies and integrates naturally with `git` and shell scripts.

## Key Concepts

- **Auth**: Authenticate to GitHub.com or GitHub Enterprise Server; manage multiple accounts
- **Repos**: Clone, create, fork, view, and list repositories from the terminal
- **Issues**: Create, list, view, edit, close, reopen, and comment on issues
- **Pull Requests**: Create, review, merge, check out, and monitor pull requests
- **Releases**: Create, publish, upload assets to, and download from GitHub Releases
- **Gists**: Create, view, edit, and delete GitHub Gists for sharing code snippets
- **Actions**: List, view, watch, rerun, and trigger GitHub Actions workflow runs
- **Extensions**: Install and build community extensions that add new `gh` subcommands
- **API**: Call the GitHub REST and GraphQL APIs directly with automatic authentication
- **Search**: Search repositories, issues, pull requests, code, and commits across GitHub

## Content in This Section

- [By Example](/en/learn/software-engineering/automation-tools/gh-cli/by-example) —
  Learn GitHub CLI through 85 heavily annotated shell examples covering authentication,
  repositories, issues, pull requests, releases, gists, actions, API calls, extensions,
  search, and automation patterns.
