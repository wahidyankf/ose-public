# File Format and Workflow

## File Path and Naming

Path: `social-media-posts/linkedin/YYYY/YYYY-MM-DD__linkedin__ose-update-week-NNNN.md` — posts are
grouped into a four-digit **year folder** matching the filename's date prefix (the year of
posting, not the year the reporting window opened). Create the year folder if the new post is the
first of its year. Filename: ISO date of posting; zero-padded 4-digit week number.

**Canonical exemplar**: model every new post on
[`social-media-posts/linkedin/2026/2026-05-25__linkedin__ose-update-week-0027.md`](../../../../social-media-posts/linkedin/2026/2026-05-25__linkedin__ose-update-week-0027.md) —
match its header, section structure, tone, and length. Always read the latest existing post before
drafting so format and voice stay consistent.

**Week title**: use only `Week <NN>`. Do not append phase or phase-week counters.

## Post Template

```
Posted: <Weekday, Month D, YYYY>
Platform: LinkedIn
Window: <prev-window-end +0700> → <now +0700>. ~<N> commits across both repos (ose-public <a>, <private-sibling> <b>).

---

OPEN SHARIA ENTERPRISE
Week <NN>

Highlights: <one-paragraph lead summarizing the biggest changes>

🌐 Cross-repo
- <changes spanning all repos>

🌳 ose-public
<paragraph(s)>

🏗️ Private sibling
<paragraph(s)>

🔜 Next 2–4 weeks
<forward-looking paragraph>

<optional first-person personal reflection>

Insha Allah.

- ose-public: https://github.com/wahidyankf/ose-public
- OrganicLever: https://www.organiclever.com/
- Updates: https://www.oseplatform.com/updates/
- Learning: https://www.ayokoding.com
```

The header lines above the `---` are bookkeeping only. Keep them accurate but remember they never
reach LinkedIn.

## Workflow

1. **Establish the window.** Read the most recent file across every year folder under
   `social-media-posts/linkedin/` (`ls social-media-posts/linkedin/*/ | sort | tail -1`, or read
   the highest year folder's last file — do not stop at the current year, which is empty every
   January); take its `Window:` end timestamp as the new window start, and its week number + 1 as
   the new week. New window end = now (+0700).
2. **Gather commits** across both repos at `~/ose-projects/{ose-public,private-sibling}`.
   Fetch safely, then use `git -C <repo> rev-list --count --since=<start> origin/main` for
   accurate totals and `git -C <repo> log origin/main --since=<start>` for subjects. RTK caps
   `git log` output at ~50 lines — use `rtk proxy git -C <repo> log ...` or `rev-list --count` when
   you need the full count. Include only completed work present on `origin/main`; never present
   local-only, staged, open-PR, or paused-plan work as completed.
3. **Compare endpoints and draft the body** using the structure above. Read the previous post as
   the baseline, compare it with the final completed `origin/main` state, and write baseline →
   result rather than an intermediate changelog. Lead with the most significant structural
   changes; compress routine synchronized changes into single clauses. Active voice, professional
   tone, benefits-focused.
4. **Measure** the body (command in reference module 01) and **trim until ≤ 3,000** characters.
5. **Write** the file at the correct path/filename. Report the final character count to the caller.
