import 'dart:js_interop';

import 'package:web/web.dart';

import '../services/auth_service.dart' as auth_svc;

void render(Element parent) {
  final main = document.createElement('main') as HTMLElement;
  main.style.setProperty('max-width', '40rem');
  main.style.setProperty('margin', '4rem auto');
  main.style.setProperty('padding', '2rem');
  main.style.setProperty('text-align', 'center');

  final h1 = document.createElement('h1') as HTMLHeadingElement;
  h1.textContent = 'Demo Frontend';
  h1.style.setProperty('margin-bottom', '1.5rem');
  main.appendChild(h1);

  final card = document.createElement('div') as HTMLDivElement;
  card.style.setProperty('border', '1px solid #ddd');
  card.style.setProperty('border-radius', '8px');
  card.style.setProperty('padding', '2rem');
  card.style.setProperty('background-color', '#ffffff');
  card.style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.08)');

  final h2 = document.createElement('h2') as HTMLHeadingElement;
  h2.textContent = 'Backend Status';
  h2.style.setProperty('margin-top', '0');
  h2.style.setProperty('margin-bottom', '1rem');
  card.appendChild(h2);

  final statusEl = document.createElement('p') as HTMLParagraphElement;
  statusEl.textContent = 'Checking backend status...';
  statusEl.style.setProperty('color', '#666');
  card.appendChild(statusEl);

  main.appendChild(card);

  final loginLink = document.createElement('p') as HTMLParagraphElement;
  loginLink.style.setProperty('margin-top', '2rem');
  loginLink.style.setProperty('color', '#666');

  final a = document.createElement('a') as HTMLAnchorElement;
  a.href = '/login';
  a.style.setProperty('color', '#1558c0');
  a.textContent = 'Log in';
  a.addEventListener(
    'click',
    ((Event e) {
      e.preventDefault();
      window.history.pushState(null, '', '/login');
      window.dispatchEvent(PopStateEvent('popstate'));
    }).toJS,
  );
  loginLink.appendChild(a);
  loginLink.append(document.createTextNode(' to access the full dashboard.') as Node);
  main.appendChild(loginLink);

  parent.appendChild(main);

  // Fetch health
  auth_svc.getHealth().then((health) {
    statusEl.remove();
    final statusDiv = document.createElement('div') as HTMLDivElement;
    statusDiv.style.setProperty('display', 'flex');
    statusDiv.style.setProperty('align-items', 'center');
    statusDiv.style.setProperty('gap', '0.5rem');
    statusDiv.style.setProperty('justify-content', 'center');

    final dot = document.createElement('span') as HTMLSpanElement;
    dot.setAttribute('aria-hidden', 'true');
    dot.style.setProperty('width', '0.75rem');
    dot.style.setProperty('height', '0.75rem');
    dot.style.setProperty('border-radius', '50%');
    dot.style.setProperty(
      'background-color',
      health.status == 'UP' ? '#2d7a2d' : '#c0392b',
    );
    dot.style.setProperty('display', 'inline-block');
    statusDiv.appendChild(dot);

    final text = document.createElement('span') as HTMLSpanElement;
    text.textContent = health.status;
    text.style.setProperty('font-weight', 'bold');
    text.style.setProperty(
      'color',
      health.status == 'UP' ? '#2d7a2d' : '#c0392b',
    );
    statusDiv.appendChild(text);

    card.appendChild(statusDiv);
  }).catchError((_) {
    statusEl.remove();
    final err = document.createElement('p') as HTMLParagraphElement;
    err.setAttribute('role', 'alert');
    err.textContent = 'Backend unavailable';
    err.style.setProperty('color', '#c0392b');
    err.style.setProperty('background-color', '#fdf2f2');
    err.style.setProperty('padding', '0.75rem');
    err.style.setProperty('border-radius', '4px');
    card.appendChild(err);
  });
}
