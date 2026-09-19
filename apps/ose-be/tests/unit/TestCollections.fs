namespace OseBe.Tests.Unit

open Xunit

// Disable cross-class test parallelisation for the whole unit assembly. Several
// test modules save/restore process-wide environment variables around a test
// body (DATABASE_URL, OSE_BE_NATS_URL, the OSE_BE_OPENROUTER_* trio); xunit v3
// parallelises across test classes by default, and two classes mutating the
// same variable concurrently is a genuine data race (observed: an
// OpenRouterClientTests mutation of OSE_BE_OPENROUTER_API_KEY intermittently
// leaked into a concurrently-running AiOrchestrationTests assertion). Mirrors
// the same fix already applied in apps/organiclever-be/tests/integration/TestCollections.fs.
[<assembly: CollectionBehavior(DisableTestParallelization = true)>]
do ()
