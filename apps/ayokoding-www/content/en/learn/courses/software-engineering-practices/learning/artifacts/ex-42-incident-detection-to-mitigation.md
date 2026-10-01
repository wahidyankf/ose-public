---
title: "Artifact: Incident Timeline -- Detect, Then Mitigate, Then Root-Cause"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 82
---

> ex-42 &middot; exercises co-23 &middot; a seeded incident, walked from alert to resolution.

**Seeded incident**: the flash-sale flag (Example 41's kill switch) was left ON in error, causing
gift-card redemption to return `503` for every real customer starting at 14:02 UTC.

```mermaid
timeline
    accTitle: timeline diagram
    accDescr: Timeline of incident INC-0104, a gift-card redemption outage. At 14:02 an alert fires, at 14:04 on-call confirms every redemption returns 503, at 14:06 the kill switch is flipped back ON, at 14:07 traffic recovers, at 14:45 the root cause is found in a stale ops-toggle script, and at 15:30 a confirmation prompt fix is made and a postmortem is scheduled.
    title Incident INC-0104 -- gift-card redemption outage
    14:02 : Alert fires -- redemption error rate > 5%
    14:04 : Detect -- on-call confirms 100% of redemption requests return 503
    14:06 : Mitigate -- flip the kill switch back ON (Example 41), no redeploy, no root cause yet
    14:07 : Redemption traffic recovers to 200 OK
    14:45 : Root-cause -- a stale ops-toggle script re-ran and re-disabled the feature at 14:02
    15:30 : Fix -- the toggle script gains a confirmation prompt; postmortem scheduled
```

**Verify**: mitigation (14:06, flipping the switch back) happens BEFORE root-cause (14:45,
identifying the stale script) -- the timeline names a mitigation step ahead of the eventual fix,
satisfying co-23's detect-then-mitigate-then-root-cause order.

**Key takeaway**: the fastest path back to a working system (14:06, one flag flip) and the fastest
path to understanding WHY it broke (14:45, investigating the stale script) are two different
activities, and doing them in the wrong order costs 39 extra minutes of customer-facing downtime.

**Why It Matters**: the same kill-switch mechanism Example 41 introduced as a release tool is what
makes the 1-minute mitigation possible here -- a feature flag is not just a deploy/release
decoupler (co-22), it is also the fastest mitigation lever an on-call engineer has, precisely
because flipping it needs no code change, no review, and no redeploy.
