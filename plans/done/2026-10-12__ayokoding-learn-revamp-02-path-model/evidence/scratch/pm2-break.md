# PM2 break: version-control-and-git removed from AI manifest assumes (expect FAIL) (raw UNIT-NODE output)

```text
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.

 RUN  v4.1.0 ./apps/ayokoding-www

 ❯  unit  tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts (8 tests | 1 failed) 8ms
     × careers/immediately-effective/ai-engineer reports zero path-model violations 4ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL   unit  tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts > real manifests pass every path-model rule (plan 02 AC-3.1) > careers/immediately-effective/ai-engineer reports zero path-model violations
AssertionError: manifest: careers/immediately-effective/ai-engineer.json (careers/immediately-effective/ai-engineer)
pathModel: {"unresolvedIds":[],"duplicateIds":[],"duplicatePhaseIds":[],"emptyPhaseIds":[],"coreAfterExtension":[],"closure":[{"courseId":"cicd-and-release-engineering","missingPrerequisite":"version-control-and-git"}],"outlineInCore":[],"goalsOutsideCore":[],"coreMismatch":null,"unusedAssumes":[],"assumesInsidePath":[],"unresolvedAssumes":[],"skillsExtension":[],"markerNotAllowed":false}
ordering: []
expectedCore: n/a (no goals): expected [ { …(2) } ] to deeply equal []

- Expected
+ Received

- []
+ [
+   {
+     "courseId": "cicd-and-release-engineering",
+     "missingPrerequisite": "version-control-and-git",
+   },
+ ]

 ❯ tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts:106:42
    104|       expect(violations.emptyPhaseIds, detail).toEqual([]);
    105|       expect(violations.coreAfterExtension, detail).toEqual([]);
    106|       expect(violations.closure, detail).toEqual([]);
       |                                          ^
    107|       expect(violations.outlineInCore, detail).toEqual([]);
    108|       expect(violations.goalsOutsideCore, detail).toEqual([]);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
   Start at  13:39:07
   Duration  4.99s (transform 53ms, setup 0ms, import 3.96s, tests 8ms, environment 0ms)
```
