# Old-app verification of the URL inventory

Requests went to the running old app (dev server on port 3101). No request followed a redirect, and each was made once.

- URLs checked: 3291; answering 200 at the same path: 3290; differing: 1
- Redirect sources checked: 87; matching the inventory status and target: 87; differing: 0

## URLs whose old-app status differs from the inventory

| URL | old-app status | old-app location | reason                |
| --- | -------------- | ---------------- | --------------------- |
| /   | 308            | /en              | inventory expects 200 |

## Redirect sources whose old-app answer differs from the inventory

None.
