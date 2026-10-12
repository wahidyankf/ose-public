# PM1 break: status-outline removed from accounting-foundations (expect FAIL) (raw UNIT-NODE output)

```text
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.

 RUN  v4.1.0 ./apps/ayokoding-www

 ❯  unit  tests/unit/features/content/course-frontmatter.unit.test.ts (2 tests | 1 failed) 690ms
     × marks every course under 1000 words with status outline 672ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL   unit  tests/unit/features/content/course-frontmatter.unit.test.ts > course frontmatter (outline-course-status) > marks every course under 1000 words with status outline
AssertionError: courses under 1000 words without status outline: accounting-foundations: expected [ 'accounting-foundations' ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "accounting-foundations",
+ ]

 ❯ tests/unit/features/content/course-frontmatter.unit.test.ts:59:97
     57|       }
     58|     }
     59|     expect(unmarked, `courses under 1000 words without status outline:…
       |                                                                                                 ^
     60|   });
     61| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Start at  13:38:33
   Duration  5.76s (transform 23ms, setup 0ms, import 3.97s, tests 690ms, environment 0ms)
```
