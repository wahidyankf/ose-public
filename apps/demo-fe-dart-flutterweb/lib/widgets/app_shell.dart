import 'dart:js_interop';

import 'package:web/web.dart';

import '../services/api_client.dart';
import '../services/auth_service.dart' as auth_svc;
import '../services/user_service.dart' as user_svc;
import '../main.dart' as router;

typedef RenderFn = void Function(Element content);

void renderWithShell(Element parent, RenderFn renderContent) {
  final wrapper = document.createElement('div') as HTMLDivElement;
  wrapper.style.setProperty('display', 'flex');
  wrapper.style.setProperty('flex-direction', 'column');
  wrapper.style.setProperty('min-height', '100vh');

  // Header
  final header = _buildHeader();
  wrapper.appendChild(header);

  // Body (sidebar + main)
  final body = document.createElement('div') as HTMLDivElement;
  body.style.setProperty('display', 'flex');
  body.style.setProperty('flex', '1');
  body.style.setProperty('overflow', 'hidden');

  final sidebar = _buildSidebar();
  body.appendChild(sidebar);

  final main = document.createElement('main') as HTMLElement;
  main.id = 'main-content';
  main.style.setProperty('flex', '1');
  main.style.setProperty('padding', '1.5rem');
  main.style.setProperty('overflow-y', 'auto');
  main.style.setProperty('background-color', '#f5f7fa');
  body.appendChild(main);

  wrapper.appendChild(body);
  parent.appendChild(wrapper);

  renderContent(main);
}

Element _buildHeader() {
  final header = document.createElement('header') as HTMLElement;
  header.style.setProperty('display', 'flex');
  header.style.setProperty('align-items', 'center');
  header.style.setProperty('justify-content', 'space-between');
  header.style.setProperty('padding', '0 1rem');
  header.style.setProperty('height', '3.5rem');
  header.style.setProperty('background-color', '#1a1a2e');
  header.style.setProperty('color', '#ffffff');
  header.style.setProperty('position', 'sticky');
  header.style.setProperty('top', '0');
  header.style.setProperty('z-index', '100');
  header.style.setProperty('box-shadow', '0 2px 4px rgba(0,0,0,0.3)');

  final left = document.createElement('div') as HTMLDivElement;
  left.style.setProperty('display', 'flex');
  left.style.setProperty('align-items', 'center');
  left.style.setProperty('gap', '1rem');

  final menuBtn = document.createElement('button') as HTMLButtonElement;
  menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
  menuBtn.style.setProperty('background', 'none');
  menuBtn.style.setProperty('border', 'none');
  menuBtn.style.setProperty('color', '#ffffff');
  menuBtn.style.setProperty('cursor', 'pointer');
  menuBtn.style.setProperty('font-size', '1.5rem');
  menuBtn.style.setProperty('padding', '0.25rem');
  menuBtn.innerHTML = '&#9776;'.toJS;
  left.appendChild(menuBtn);

  final title = document.createElement('span') as HTMLSpanElement;
  title.style.setProperty('font-weight', 'bold');
  title.style.setProperty('font-size', '1.1rem');
  title.textContent = 'Demo Frontend';
  left.appendChild(title);
  header.appendChild(left);

  // User menu
  final right = document.createElement('div') as HTMLDivElement;
  right.style.setProperty('position', 'relative');

  final userBtn = document.createElement('button') as HTMLButtonElement;
  userBtn.setAttribute('aria-label', 'User menu');
  userBtn.setAttribute('aria-haspopup', 'true');
  userBtn.style.setProperty('background', 'none');
  userBtn.style.setProperty('border', '1px solid #444');
  userBtn.style.setProperty('color', '#ffffff');
  userBtn.style.setProperty('cursor', 'pointer');
  userBtn.style.setProperty('padding', '0.4rem 0.8rem');
  userBtn.style.setProperty('border-radius', '4px');
  userBtn.style.setProperty('font-size', '0.9rem');
  userBtn.innerHTML = 'Account &#9660;'.toJS;

  // Fetch username
  user_svc.getCurrentUser().then((user) {
    userBtn.innerHTML = '${_escapeHtml(user.username)} &#9660;'.toJS;
  }).catchError((_) {});

  HTMLDivElement? menuDiv;
  userBtn.addEventListener(
    'click',
    ((Event _) {
      if (menuDiv != null) {
        menuDiv!.remove();
        menuDiv = null;
        userBtn.setAttribute('aria-expanded', 'false');
        return;
      }
      userBtn.setAttribute('aria-expanded', 'true');

      final newMenuDiv = document.createElement('div') as HTMLDivElement;
      newMenuDiv.setAttribute('role', 'menu');
      newMenuDiv.style.setProperty('position', 'absolute');
      newMenuDiv.style.setProperty('right', '0');
      newMenuDiv.style.setProperty('top', 'calc(100% + 0.25rem)');
      newMenuDiv.style.setProperty('background-color', '#ffffff');
      newMenuDiv.style.setProperty('color', '#333');
      newMenuDiv.style.setProperty('border', '1px solid #ddd');
      newMenuDiv.style.setProperty('border-radius', '4px');
      newMenuDiv.style.setProperty('min-width', '12rem');
      newMenuDiv.style.setProperty('box-shadow', '0 4px 12px rgba(0,0,0,0.15)');
      newMenuDiv.style.setProperty('z-index', '200');
      menuDiv = newMenuDiv;

      final logoutBtn = document.createElement('button') as HTMLButtonElement;
      logoutBtn.setAttribute('role', 'menuitem');
      logoutBtn.textContent = 'Log out';
      logoutBtn.style.setProperty('display', 'block');
      logoutBtn.style.setProperty('width', '100%');
      logoutBtn.style.setProperty('padding', '0.75rem 1rem');
      logoutBtn.style.setProperty('background', 'none');
      logoutBtn.style.setProperty('border', 'none');
      logoutBtn.style.setProperty('text-align', 'left');
      logoutBtn.style.setProperty('cursor', 'pointer');
      logoutBtn.style.setProperty('font-size', '0.9rem');
      logoutBtn.addEventListener(
        'click',
        ((Event _) {
          () async {
            final token = getRefreshToken();
            if (token != null) {
              try {
                await auth_svc.logout(token);
              } catch (_) {}
            }
            clearTokens();
            router.navigateTo('/login');
          }();
        }).toJS,
      );
      newMenuDiv.appendChild(logoutBtn);

      final logoutAllBtn = document.createElement('button') as HTMLButtonElement;
      logoutAllBtn.setAttribute('role', 'menuitem');
      logoutAllBtn.textContent = 'Log out all devices';
      logoutAllBtn.style.setProperty('display', 'block');
      logoutAllBtn.style.setProperty('width', '100%');
      logoutAllBtn.style.setProperty('padding', '0.75rem 1rem');
      logoutAllBtn.style.setProperty('background', 'none');
      logoutAllBtn.style.setProperty('border', 'none');
      logoutAllBtn.style.setProperty('border-top', '1px solid #eee');
      logoutAllBtn.style.setProperty('text-align', 'left');
      logoutAllBtn.style.setProperty('cursor', 'pointer');
      logoutAllBtn.style.setProperty('font-size', '0.9rem');
      logoutAllBtn.addEventListener(
        'click',
        ((Event _) {
          () async {
            try {
              await auth_svc.logoutAll();
            } catch (_) {}
            clearTokens();
            router.navigateTo('/login');
          }();
        }).toJS,
      );
      newMenuDiv.appendChild(logoutAllBtn);

      right.appendChild(newMenuDiv);
    }).toJS,
  );

  right.appendChild(userBtn);
  header.appendChild(right);

  return header;
}

Element _buildSidebar() {
  final nav = document.createElement('nav') as HTMLElement;
  nav.setAttribute('aria-label', 'Main navigation');
  nav.style.setProperty('width', '14rem');
  nav.style.setProperty('background-color', '#16213e');
  nav.style.setProperty('color', '#e0e0e0');
  nav.style.setProperty('display', 'flex');
  nav.style.setProperty('flex-direction', 'column');
  nav.style.setProperty('padding-top', '1rem');
  nav.style.setProperty('overflow-y', 'auto');
  nav.style.setProperty('flex-shrink', '0');

  final ul = document.createElement('ul') as HTMLUListElement;
  ul.style.setProperty('list-style', 'none');
  ul.style.setProperty('margin', '0');
  ul.style.setProperty('padding', '0.5rem 0');

  final currentPath = window.location.pathname;

  final items = [
    {'href': '/', 'label': 'Home', 'icon': '&#127968;'},
    {'href': '/expenses', 'label': 'Expenses', 'icon': '&#128181;'},
    {'href': '/expenses/summary', 'label': 'Summary', 'icon': '&#128202;'},
    {'href': '/admin/users', 'label': 'Admin', 'icon': '&#128101;'},
    {'href': '/tokens', 'label': 'Tokens', 'icon': '&#128272;'},
    {'href': '/profile', 'label': 'Profile', 'icon': '&#128100;'},
  ];

  for (final item in items) {
    final li = document.createElement('li') as HTMLLIElement;
    final isActive = currentPath == item['href'];

    final a = document.createElement('a') as HTMLAnchorElement;
    a.href = item['href']!;
    a.style.setProperty('display', 'flex');
    a.style.setProperty('align-items', 'center');
    a.style.setProperty('gap', '0.75rem');
    a.style.setProperty('padding', '0.75rem 1rem');
    a.style.setProperty('color', isActive ? '#ffffff' : '#b0b8c8');
    a.style.setProperty(
      'background-color',
      isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    );
    a.style.setProperty('text-decoration', 'none');
    a.style.setProperty('border-radius', '4px');
    a.style.setProperty('margin', '0 0.25rem');
    a.style.setProperty('font-weight', isActive ? '600' : 'normal');

    if (isActive) {
      a.setAttribute('aria-current', 'page');
    }

    final icon = document.createElement('span') as HTMLSpanElement;
    icon.setAttribute('aria-hidden', 'true');
    icon.style.setProperty('font-size', '1.2rem');
    icon.style.setProperty('flex-shrink', '0');
    icon.innerHTML = item['icon']!.toJS;
    a.appendChild(icon);

    final label = document.createElement('span') as HTMLSpanElement;
    label.style.setProperty('font-size', '0.9rem');
    label.textContent = item['label']!;
    a.appendChild(label);

    final href = item['href']!;
    a.addEventListener(
      'click',
      ((Event e) {
        e.preventDefault();
        router.navigateTo(href);
      }).toJS,
    );

    li.appendChild(a);
    ul.appendChild(li);
  }

  nav.appendChild(ul);
  return nav;
}

String _escapeHtml(String text) {
  return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
}
