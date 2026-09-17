namespace OseId.Domain.Capabilities;

/// <summary>
/// The complete inventory of identity capabilities OSE ID registers and refuses. This is
/// a security inventory rather than a feature-flag table: enabling a capability later
/// removes its row here, and nothing at runtime can turn one on.
/// </summary>
public static class DisabledCapabilityCatalog
{
    private static readonly DisabledCapability[] _inventory =
    [
        new("OIDC authorization", "GET", "/connect/authorize"),
        new("OAuth token issuance", "POST", "/connect/token"),
        new("external-provider sign-in", "GET", "/external/google/challenge"),
        new("SCIM user provisioning", "POST", "/scim/v2/Users"),
        new("platform administration", "GET", "/platform/admin/companies"),
    ];

    /// <summary>Every disabled capability, in contract order.</summary>
    public static IReadOnlyList<DisabledCapability> All => _inventory;

    /// <summary>
    /// The capability addressed by this exact method and path, or <see langword="null" />
    /// when the pair is outside the inventory. A different method on a listed path is
    /// outside the inventory too: matching is by the pair, never by the path alone.
    /// </summary>
    public static DisabledCapability? Find(string method, string path) =>
        Array.Find(
            _inventory,
            capability =>
                string.Equals(capability.Method, method, StringComparison.Ordinal)
                && string.Equals(capability.Path, path, StringComparison.Ordinal)
        );

    /// <summary>The capability with this name.</summary>
    /// <exception cref="KeyNotFoundException">The name is outside the inventory.</exception>
    public static DisabledCapability ByCapability(string capability) =>
        Array.Find(_inventory, entry => string.Equals(entry.Capability, capability, StringComparison.Ordinal))
        ?? throw new KeyNotFoundException($"'{capability}' is not a disabled OSE ID capability.");
}
