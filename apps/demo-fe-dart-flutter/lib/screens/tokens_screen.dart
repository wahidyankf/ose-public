/// Tokens screen — session and JWKS information.
///
/// Displays decoded claims from the current access token (user ID, issuer,
/// expiry, role) and shows the JWKS endpoint details loaded via
/// [jwksProvider]. Wrapped in [AppShell].
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:demo_fe_dart_flutter/core/api/api_client.dart';
import 'package:demo_fe_dart_flutter/core/providers/token_provider.dart';
import 'package:demo_fe_dart_flutter/widgets/app_shell.dart';

class TokensScreen extends ConsumerWidget {
  const TokensScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claims = ref.watch(tokenClaimsProvider);
    final jwksAsync = ref.watch(jwksProvider);

    return AppShell(
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Session & Token Info',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 24),
          _SessionCard(claims: claims),
          const SizedBox(height: 16),
          _JwksCard(jwksAsync: jwksAsync),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Session card — decoded access token claims
// ---------------------------------------------------------------------------

class _SessionCard extends StatelessWidget {
  const _SessionCard({required this.claims});

  final Map<String, dynamic> claims;

  @override
  Widget build(BuildContext context) {
    if (claims.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No active session. Please log in.'),
        ),
      );
    }

    final userId =
        claims['sub'] as String? ?? claims['user_id'] as String? ?? '—';
    final issuer = claims['iss'] as String? ?? '—';
    final role = claims['role'] as String? ?? '—';
    final expRaw = claims['exp'];
    String expiry = '—';
    if (expRaw is int) {
      final expDate = DateTime.fromMillisecondsSinceEpoch(expRaw * 1000);
      expiry = expDate.toLocal().toString();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Current Session',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Divider(),
            _ClaimRow(label: 'User ID (sub)', value: userId),
            _ClaimRow(label: 'Issuer', value: issuer),
            _ClaimRow(label: 'Role', value: role),
            _ClaimRow(label: 'Expires', value: expiry),
            const SizedBox(height: 8),
            Text('All claims', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 4),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _formatClaims(claims),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatClaims(Map<String, dynamic> claims) {
    final buffer = StringBuffer();
    for (final entry in claims.entries) {
      buffer.writeln('${entry.key}: ${entry.value}');
    }
    return buffer.toString().trimRight();
  }
}

class _ClaimRow extends StatelessWidget {
  const _ClaimRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// JWKS card — public key endpoint info
// ---------------------------------------------------------------------------

class _JwksCard extends StatelessWidget {
  const _JwksCard({required this.jwksAsync});

  final AsyncValue<Map<String, dynamic>> jwksAsync;

  @override
  Widget build(BuildContext context) {
    const jwksUrl = '$kBaseUrl/.well-known/jwks.json';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'JWKS Endpoint',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Divider(),
            const _ClaimRow(label: 'URL', value: jwksUrl),
            const SizedBox(height: 8),
            jwksAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: CircularProgressIndicator(),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'Error loading JWKS: $e',
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
              data: (jwks) => _JwksContent(jwks: jwks),
            ),
          ],
        ),
      ),
    );
  }
}

class _JwksContent extends StatelessWidget {
  const _JwksContent({required this.jwks});

  final Map<String, dynamic> jwks;

  @override
  Widget build(BuildContext context) {
    final keys = (jwks['keys'] as List<dynamic>?) ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Keys: ${keys.length}',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 8),
        ...keys.asMap().entries.map(
          (entry) => _KeySummary(
            index: entry.key + 1,
            key0: entry.value as Map<String, dynamic>,
          ),
        ),
      ],
    );
  }
}

class _KeySummary extends StatelessWidget {
  const _KeySummary({required this.index, required this.key0});

  final int index;
  final Map<String, dynamic> key0;

  @override
  Widget build(BuildContext context) {
    final kid = key0['kid'] as String? ?? '—';
    final kty = key0['kty'] as String? ?? '—';
    final alg = key0['alg'] as String? ?? '—';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Key $index',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            Text('ID (kid): $kid', style: const TextStyle(fontSize: 12)),
            Text('Type (kty): $kty', style: const TextStyle(fontSize: 12)),
            Text('Algorithm: $alg', style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
