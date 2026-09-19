using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// Assembly-level cleanup for the one process this adapter keeps alive. An E2E run that
/// leaves a listener behind poisons the next run's port reservation, so releasing it is
/// part of the test, not housekeeping.
/// </summary>
[Binding]
public static class BackendLifecycle
{
    [AfterTestRun]
    public static void StopTheServedBackend() => RunningBackend.Stop();
}
