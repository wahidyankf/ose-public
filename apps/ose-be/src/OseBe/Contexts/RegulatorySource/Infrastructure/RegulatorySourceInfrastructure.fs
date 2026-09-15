namespace OseBe.Contexts.RegulatorySource

open System.Diagnostics.CodeAnalysis
open OseBe.Infrastructure.AppDbContext
open OseBe.Infrastructure.Repositories.RepositoryTypes
open OseBe.Infrastructure.Repositories.EfRepositories

/// Infrastructure adapters for the regulatory-source bounded context.
///
/// Adapts the shared EF regulatory-document repository for this context's
/// storage port.
module Infrastructure =

    /// The EF-backed document repository for this context.
    [<ExcludeFromCodeCoverage(Justification =
        "Integration-tested against real PostgreSQL — see tests/integration/DatabaseBootTests.fs")>]
    let repository (db: AppDbContext) : RegulatoryDocumentRepository = regulatoryDocumentRepository db
