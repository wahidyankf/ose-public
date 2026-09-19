using System.Data;
using Npgsql;
using OseId.Application.Persistence.Ports;
using OseId.Domain.Persistence;
using SqlKata;

namespace OseId.Infrastructure.Persistence;

/// <summary>
/// Executes the granted history read over Npgsql.
///
/// The adapter opens its own connection per read and disposes it: readiness must not hold a
/// connection open across requests, because an instance that did so would be carrying state that
/// decides a security-relevant answer. Every failure mode collapses to <c>Unavailable</c> so the
/// provider's message — which names the host and sometimes the user — cannot reach a caller.
/// </summary>
public sealed class NpgsqlMigrationHistoryReader(NpgsqlDataSource dataSource) : IMigrationHistoryReader
{
    /// <summary>The finite runtime command budget required of every OSE-owned runtime query.</summary>
    public static readonly TimeSpan CommandTimeout = TimeSpan.FromSeconds(5);

    private readonly NpgsqlDataSource _dataSource = dataSource ?? throw new ArgumentNullException(nameof(dataSource));

    public async Task<MigrationHistoryReadResult> ReadActiveAsync(CancellationToken cancellationToken)
    {
        try
        {
            SqlResult compiled = MigrationHistoryQuery.Compile();

            await using NpgsqlConnection connection = await _dataSource
                .OpenConnectionAsync(cancellationToken)
                .ConfigureAwait(false);

            await using NpgsqlCommand command = connection.CreateCommand();
            command.CommandText = compiled.Sql;
            command.CommandTimeout = (int)CommandTimeout.TotalSeconds;

            // SqlKata emits positional @p0.. placeholders; binding them here keeps every value a
            // parameter. The active-history read is currently value-free, and this loop is what
            // keeps that true rather than accidental if a bound filter is added later.
            foreach ((string name, object value) in compiled.NamedBindings)
            {
                command.Parameters.AddWithValue(name, value ?? DBNull.Value);
            }

            await using NpgsqlDataReader reader = await command
                .ExecuteReaderAsync(CommandBehavior.SingleResult, cancellationToken)
                .ConfigureAwait(false);

            List<MigrationHistoryRecord> records = [];
            while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                records.Add(Project(reader));
            }

            return MigrationHistoryReadResult.Read(records);
        }
        // A caller that gave up is not a database outage. OperationCanceledException is deliberately
        // not caught here, so cancellation propagates and the pipeline reports it as cancellation
        // rather than as an unhealthy dependency.
        catch (NpgsqlException)
        {
            return MigrationHistoryReadResult.Unavailable();
        }
        catch (TimeoutException)
        {
            return MigrationHistoryReadResult.Unavailable();
        }
    }

    private static MigrationHistoryRecord Project(NpgsqlDataReader reader) =>
        new()
        {
            MigrationId = reader.GetString(0),
            ProductVersion = reader.GetString(1),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(2),
            CreatedBy = reader.GetString(3),
            UpdatedAt = reader.GetFieldValue<DateTimeOffset>(4),
            UpdatedBy = reader.GetString(5),
            DeletedAt = reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6),
            DeletedBy = reader.IsDBNull(7) ? null : reader.GetString(7),
        };
}
