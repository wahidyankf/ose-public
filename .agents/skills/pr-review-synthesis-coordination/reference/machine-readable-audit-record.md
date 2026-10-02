# Machine-Readable Pass Record

Every posted consolidated review carries one `ose-pr-review-pass:v1` HTML comment. The Reviews API
object is the authority; marker-like text in a PR body, top-level comment, or unauthenticated review
has no authority.

```html
<!-- ose-pr-review-pass:v1
{"repository":"owner/repo","pull_request":412,"base_ref":"main",
 "base_sha":"<base SHA>","head_sha":"<reviewed SHA>",
 "result":"clean|findings","counts":{"critical":0,"high":1,"medium":0,"low":0},
 "risk_tier":"lite","specialists":["architecture","logic"],"probe_class":"general"}
-->
```

Read the review back and require repository, PR, author, base/head coordinates, result, counts,
tier, specialist set, and probe to match the typed object and review body. Require the workflow's
output review ID to equal that object's server-assigned ID. Never put a secret, token, or copied
vulnerable value in the record.

For an independent `pr-review`, use pass-local IDs `P-F<n>`. An enclosing `pr-review-quality-gate` may
display its ordinal as `C<ordinal>-F<n>` and joins the authenticated pass record to separate credit,
disposition, checkpoint, and ceiling records. Head drift never rewrites the pass record.
