---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

Tools give an agent controlled ways to observe and act. This course builds typed tool contracts, the
function-calling boundary, and Model Context Protocol (MCP) servers and clients that make capabilities
discoverable and reusable rather than hard-wired into one agent.

## Prerequisite

Complete [The Agent Loop](/en/learn/courses/the-agent-loop/learning/overview) first. It owns the
bounded read-evaluate-act loop that chooses and dispatches a call; this course owns the tool schema,
server, client, and protocol boundary that make that call possible.

## Harness-engineering lineage

This course is one part of the contested **harness engineering** vocabulary: Anthropic's
“Effective harnesses for long-running agents” was published on **2025-11-26**, and Birgitta
Böckeler's “Harness Engineering — first thoughts” on **2026-02-17**. The relationship between
harness engineering and context engineering remains unresolved, so this course names the debate
without renaming the curriculum or adopting either containment claim. See
[Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) and
[Böckeler / Thoughtworks](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html).

## Design constraints

Tool design is prompt and interface design together: a clear name, a precise description, a strict
argument schema, and a small typed result make a call predictable. **Tool-count** degradation is a
real design constraint: as an advertised surface grows, selection becomes harder, so filter or split
tools to the task at hand. **Token efficiency** is also architectural: a tool result stays in the
model's context after it is returned, so expose the fields needed for the next decision rather than a
full service payload. The course treats the Berkeley Function-Calling Leaderboard and GeoEngine result
as directional evidence to re-check, not as a universal numerical threshold.

## Learning route

- [Learning](/en/learn/courses/agent-tools-and-mcp/learning/overview) progresses from a local typed
  function to MCP discovery, composition, validation, and a bounded capability surface.
- [Capstone](/en/learn/courses/agent-tools-and-mcp/learning/capstone/overview) consolidates a local
  server-client-tool boundary without requiring a live model or browser.
- [Drilling](/en/learn/courses/agent-tools-and-mcp/drilling/overview) reinforces contract, protocol,
  safety, and context-budget decisions.
