import 'dart:convert';

import 'package:web/web.dart';

import '../models/token.dart';
import '../services/api_client.dart';
import '../services/token_service.dart' as token_svc;

void render(Element parent) {
  final main = document.createElement('main') as HTMLElement
    ..style.setProperty('max-width', '52rem')
    ..style.setProperty('margin', '2rem auto')
    ..style.setProperty('padding', '0 1.5rem');

  final h1 = document.createElement('h1') as HTMLHeadingElement
    ..textContent = 'Token Inspector'
    ..style.setProperty('margin-bottom', '1.5rem');
  main.appendChild(h1);

  parent.appendChild(main);

  _renderAccessTokenCard(main);
  _renderJwksCard(main);
}

void _applyCardStyle(HTMLElement card) {
  card.style
    ..setProperty('background-color', '#fff')
    ..setProperty('padding', '1.5rem')
    ..setProperty('border-radius', '8px')
    ..setProperty('border', '1px solid #ddd')
    ..setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.06)')
    ..setProperty('margin-bottom', '1.5rem');
}

void _applyDlRowStyle(HTMLElement row) {
  row.style
    ..setProperty('display', 'flex')
    ..setProperty('gap', '1rem')
    ..setProperty('border-bottom', '1px solid #f0f0f0')
    ..setProperty('padding-bottom', '0.75rem')
    ..setProperty('margin-bottom', '0.75rem');
}

void _renderAccessTokenCard(HTMLElement parent) {
  final card = document.createElement('div') as HTMLDivElement;
  _applyCardStyle(card);

  final h2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'Access Token Claims'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  card.appendChild(h2);

  final token = getAccessToken();
  if (token == null || token.isEmpty) {
    final errDiv = document.createElement('div') as HTMLDivElement
      ..setAttribute('role', 'alert')
      ..textContent = 'Failed to decode token. You may not be logged in.'
      ..style.setProperty('color', '#c0392b')
      ..style.setProperty('background-color', '#fdf2f2')
      ..style.setProperty('padding', '0.75rem 1rem')
      ..style.setProperty('border-radius', '4px')
      ..style.setProperty('border', '1px solid #f5c6cb');
    card.appendChild(errDiv);
    parent.appendChild(card);
    return;
  }

  Map<String, dynamic> claims;
  try {
    claims = token_svc.decodeTokenClaims(token);
  } on Exception {
    final errDiv = document.createElement('div') as HTMLDivElement
      ..setAttribute('role', 'alert')
      ..textContent = 'Failed to decode token. You may not be logged in.'
      ..style.setProperty('color', '#c0392b')
      ..style.setProperty('background-color', '#fdf2f2')
      ..style.setProperty('padding', '0.75rem 1rem')
      ..style.setProperty('border-radius', '4px')
      ..style.setProperty('border', '1px solid #f5c6cb');
    card.appendChild(errDiv);
    parent.appendChild(card);
    return;
  }

  final parsed = TokenClaims.fromJson(claims);

  final dl = document.createElement('dl') as HTMLElement
    ..style.setProperty('margin', '0')
    ..style.setProperty('padding', '0');

  dl.appendChild(_buildDlRow(
    'Subject (User ID)',
    parsed.sub,
    ddTestId: 'token-subject',
  ));
  dl.appendChild(_buildDlRow('Issuer', parsed.iss));
  dl.appendChild(_buildDlRow(
    'Issued At',
    _formatTimestamp(parsed.iat),
  ));
  dl.appendChild(_buildDlRow(
    'Expires At',
    _formatTimestamp(parsed.exp),
  ));
  dl.appendChild(_buildDlRow(
    'Roles',
    parsed.roles.join(', '),
  ));

  card.appendChild(dl);

  final details = document.createElement('details') as HTMLDetailsElement
    ..style.setProperty('margin-top', '1rem');
  final summary = document.createElement('summary') as HTMLElement
    ..textContent = 'Raw Claims (JSON)'
    ..style.setProperty('cursor', 'pointer')
    ..style.setProperty('color', '#555')
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('user-select', 'none');
  details.appendChild(summary);

  const encoder = JsonEncoder.withIndent('  ');
  final pre = document.createElement('pre') as HTMLPreElement
    ..textContent = encoder.convert(claims)
    ..style.setProperty('background-color', '#f8f9fa')
    ..style.setProperty('padding', '1rem')
    ..style.setProperty('border-radius', '4px')
    ..style.setProperty('overflow-x', 'auto')
    ..style.setProperty('font-size', '0.82rem')
    ..style.setProperty('margin-top', '0.75rem');
  details.appendChild(pre);

  card.appendChild(details);
  parent.appendChild(card);
}

HTMLDivElement _buildDlRow(
  String term,
  String definition, {
  String? ddTestId,
}) {
  final row = document.createElement('div') as HTMLDivElement;
  _applyDlRowStyle(row);

  final dt = document.createElement('dt') as HTMLElement
    ..textContent = term
    ..style.setProperty('font-weight', '600')
    ..style.setProperty('color', '#555')
    ..style.setProperty('min-width', '12rem')
    ..style.setProperty('flex-shrink', '0');
  row.appendChild(dt);

  final dd = document.createElement('dd') as HTMLElement
    ..textContent = definition
    ..style.setProperty('margin', '0')
    ..style.setProperty('font-family', 'monospace')
    ..style.setProperty('word-break', 'break-all');

  if (ddTestId != null) {
    dd.setAttribute('data-testid', ddTestId);
  }

  row.appendChild(dd);
  return row;
}

String _formatTimestamp(int epochSeconds) {
  if (epochSeconds == 0) return '—';
  final dt = DateTime.fromMillisecondsSinceEpoch(epochSeconds * 1000);
  return dt.toLocal().toString();
}

void _renderJwksCard(HTMLElement parent) {
  final card = document.createElement('div') as HTMLDivElement;
  _applyCardStyle(card);

  final h2 = document.createElement('h2') as HTMLHeadingElement
    ..textContent = 'JWKS Endpoint'
    ..style.setProperty('margin-top', '0')
    ..style.setProperty('margin-bottom', '1rem');
  card.appendChild(h2);

  final loadingEl = document.createElement('p') as HTMLParagraphElement
    ..textContent = 'Loading JWKS...'
    ..style.setProperty('color', '#666');
  card.appendChild(loadingEl);

  parent.appendChild(card);

  token_svc.getJwks().then((jwks) {
    loadingEl.remove();

    final meta = document.createElement('div') as HTMLDivElement
      ..style.setProperty('display', 'flex')
      ..style.setProperty('align-items', 'center')
      ..style.setProperty('gap', '0.5rem')
      ..style.setProperty('margin-bottom', '1rem');

    final keyCountLabel = document.createElement('span') as HTMLSpanElement
      ..textContent = 'Key count:';
    meta.appendChild(keyCountLabel);

    final keyCountBadge = document.createElement('span') as HTMLSpanElement
      ..textContent = jwks.keys.length.toString()
      ..style.setProperty('background-color', '#1a73e8')
      ..style.setProperty('color', '#fff')
      ..style.setProperty('border-radius', '12px')
      ..style.setProperty('padding', '0.1rem 0.55rem')
      ..style.setProperty('font-size', '0.85rem')
      ..style.setProperty('font-weight', '600');
    meta.appendChild(keyCountBadge);

    card.appendChild(meta);

    final endpointLine = document.createElement('p') as HTMLParagraphElement
      ..style.setProperty('margin-bottom', '1rem')
      ..style.setProperty('color', '#444');
    endpointLine.appendChild(document.createTextNode('JWKS endpoint: ') as Node);
    final codeEl = document.createElement('code') as HTMLElement
      ..textContent = '/.well-known/jwks.json'
      ..style.setProperty('background-color', '#f0f0f0')
      ..style.setProperty('padding', '0.15rem 0.4rem')
      ..style.setProperty('border-radius', '3px')
      ..style.setProperty('font-size', '0.9rem');
    endpointLine.appendChild(codeEl);
    card.appendChild(endpointLine);

    final list = document.createElement('ul') as HTMLUListElement
      ..style.setProperty('list-style', 'none')
      ..style.setProperty('padding', '0')
      ..style.setProperty('margin', '0');

    for (final key in jwks.keys) {
      final li = document.createElement('li') as HTMLLIElement
        ..style.setProperty('background-color', '#f8f9fa')
        ..style.setProperty('border-radius', '6px')
        ..style.setProperty('padding', '0.75rem 1rem')
        ..style.setProperty('border', '1px solid #e0e0e0')
        ..style.setProperty('margin-bottom', '0.5rem');

      final keyDl = document.createElement('dl') as HTMLElement
        ..style.setProperty('margin', '0')
        ..style.setProperty('padding', '0');

      keyDl.appendChild(_buildDlRow('Key ID', key.kid));
      keyDl.appendChild(_buildDlRow('Key Type', key.kty));
      keyDl.appendChild(_buildDlRow('Use', key.use));

      li.appendChild(keyDl);
      list.appendChild(li);
    }

    card.appendChild(list);
  }).catchError((_) {
    loadingEl.remove();
    final errDiv = document.createElement('div') as HTMLDivElement
      ..setAttribute('role', 'alert')
      ..textContent = 'Failed to load JWKS.'
      ..style.setProperty('color', '#c0392b')
      ..style.setProperty('background-color', '#fdf2f2')
      ..style.setProperty('padding', '0.75rem 1rem')
      ..style.setProperty('border-radius', '4px')
      ..style.setProperty('border', '1px solid #f5c6cb');
    card.appendChild(errDiv);
  });
}
