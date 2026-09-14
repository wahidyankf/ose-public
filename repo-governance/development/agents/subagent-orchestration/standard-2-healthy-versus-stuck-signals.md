---
description: "Continues Standard 2 with the healthy-vs-stuck empirical signal table and worked examples."
when_to_use: Use when distinguishing a healthy slow-running agent from a genuinely stuck one.
---

# Standard 2 — 3-Minute Stuck-Detection Polling (Continued)

## Healthy vs. Stuck: Empirical Signal Table

| Signal                                       | Healthy                                    | Stuck                                                      |
| -------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| First mtime change after launch              | Within 3–10 min                            | Never, or after 30+ min                                    |
| Output file size growth                      | Grows steadily across polls                | Flat across multiple polls                                 |
| Task-notification arrival                    | Within 3–10 min after peer agents complete | Absent long after peers complete                           |
| Final output content (post-completion check) | Complete section                           | Ends mid-sentence or with planning text ("Now writing...") |

## Examples

```
PASS: Poll at 3-min intervals → agent A mtime updated at t+5min → healthy
PASS: t+30min, agent B mtime unchanged → TaskStop(agentB.id) → relaunch → completes
FAIL: Main agent waits indefinitely for task-notification without polling
FAIL: Main agent reads /private/tmp/...output to check progress → context overflow
FAIL: Main agent polls every 30 seconds → excessive tool-call overhead
```
