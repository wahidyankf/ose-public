namespace OseId.Domain.LocalStack;

/// <summary>
/// The order contract the local-stack runner (<c>apps/ose-id-be-e2e/scripts/local-stack.mjs</c>)
/// must follow. The runner is not written in this language, so this type carries no runtime
/// behavior of its own; it is the executable specification a Unit test can prove properties of,
/// and the runner's own comments point back to it, rather than either surface's ordering drifting
/// from the other unnoticed.
/// </summary>
public static class LifecyclePlan
{
    /// <summary>
    /// The dependency-ordered resources the runner starts and later stops. Applying migrations sits
    /// between <c>postgres</c> and <c>backend</c> but owns nothing of its own to stop, so it is not a
    /// stage here — a migration failure leaves exactly the same stage reached as a bare PostgreSQL
    /// start (1), which is what makes "reached stage count" the right unit for cleanup rather than
    /// "startup step index".
    /// </summary>
    public static readonly IReadOnlyList<string> StoppableStages = ["postgres", "backend", "web"];

    /// <summary>
    /// The stages to stop, in the order to stop them in, given how many actually started. A stage
    /// that never started is never mentioned: cleanup can only ever undo what happened, never guess
    /// at what a later stage would have been.
    /// </summary>
    public static IReadOnlyList<string> CleanupOrder(int reachedStageCount)
    {
        if (reachedStageCount < 0 || reachedStageCount > StoppableStages.Count)
        {
            throw new ArgumentOutOfRangeException(
                nameof(reachedStageCount),
                reachedStageCount,
                $"must be between 0 and {StoppableStages.Count}"
            );
        }

        return [.. StoppableStages.Take(reachedStageCount).Reverse()];
    }
}
