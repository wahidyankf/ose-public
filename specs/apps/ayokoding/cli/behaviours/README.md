# CLI Behaviour Corpus

Feature files in this corpus. Steps speak about courses, units, and lessons,
never about Go types. Every scenario has unit and integration bindings; E2E
binds the scenarios that need the real binary or real containers, and every
other scenario carries `@e2e-exempt` with an exemption comment naming its
integration proof.
