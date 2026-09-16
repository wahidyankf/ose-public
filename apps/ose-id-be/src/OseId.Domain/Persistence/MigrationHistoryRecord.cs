namespace OseId.Domain.Persistence;

/// <summary>
/// One applied migration, as the serving role is allowed to see it.
///
/// The six audit fields are modelled because readiness must be able to state that they are present
/// and that the row is active; a projection that dropped them could not tell an active row from a
/// tombstone, which is the one distinction the no-hard-delete contract rests on.
/// </summary>
public sealed record MigrationHistoryRecord
{
    public required string MigrationId { get; init; }

    public required string ProductVersion { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }

    public required string CreatedBy { get; init; }

    public required DateTimeOffset UpdatedAt { get; init; }

    public required string UpdatedBy { get; init; }

    /// <summary>Null for an active row. Migration history is never removed, so this stays null.</summary>
    public DateTimeOffset? DeletedAt { get; init; }

    /// <summary>Null exactly with <see cref="DeletedAt" />.</summary>
    public string? DeletedBy { get; init; }

    /// <summary>A row is active when it carries no deletion disposition at all.</summary>
    public bool IsActive => DeletedAt is null && DeletedBy is null;
}
