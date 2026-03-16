import 'dart:async';
import 'dart:js_interop';

import 'package:web/web.dart';

import 'services/api_client.dart';
import 'services/auth_service.dart' as auth_svc;
import 'pages/home_page.dart' as home;
import 'pages/login_page.dart' as login;
import 'pages/register_page.dart' as register;
import 'pages/expenses_page.dart' as expenses;
import 'pages/expense_detail_page.dart' as detail;
import 'pages/expense_summary_page.dart' as summary;
import 'pages/profile_page.dart' as profile;
import 'pages/tokens_page.dart' as tokens;
import 'pages/admin_page.dart' as admin;
import 'widgets/app_shell.dart' as shell;

Timer? _refreshTimer;

void main() {
  _initAuth();
  _handleRoute();
  window.addEventListener('popstate', ((Event _) => _handleRoute()).toJS);
}

void _initAuth() {
  _refreshTimer?.cancel();
  final token = getAccessToken();
  if (token != null) {
    _startRefreshTimer();
  }

  window.addEventListener('auth:set', ((Event _) {
    _startRefreshTimer();
  }).toJS);

  window.addEventListener('auth:cleared', ((Event _) {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }).toJS);
}

void _startRefreshTimer() {
  _refreshTimer?.cancel();
  _refreshTimer = Timer.periodic(
    const Duration(minutes: 4),
    (_) => _doRefresh(),
  );
}

Future<void> _doRefresh() async {
  final token = getRefreshToken();
  if (token == null) {
    clearTokens();
    navigateTo('/login');
    return;
  }
  try {
    final result = await auth_svc.refreshToken(token);
    setTokens(result.accessToken, result.refreshToken);
  } catch (_) {
    clearTokens();
    navigateTo('/login');
  }
}

void navigateTo(String path) {
  window.history.pushState(null, '', path);
  _handleRoute();
}

void _handleRoute() {
  final path = window.location.pathname;
  final appDiv = document.getElementById('app');
  if (appDiv == null) return;

  while (appDiv.firstChild != null) {
    appDiv.removeChild(appDiv.firstChild!);
  }
  appDiv.textContent = '';

  // Public routes
  if (path == '/') {
    home.render(appDiv);
    return;
  }
  if (path == '/login') {
    login.render(appDiv);
    return;
  }
  if (path == '/register') {
    register.render(appDiv);
    return;
  }

  // Protected routes — check auth
  if (getAccessToken() == null) {
    navigateTo('/login');
    return;
  }

  if (path == '/expenses') {
    shell.renderWithShell(appDiv, expenses.render);
  } else if (path == '/expenses/summary') {
    shell.renderWithShell(appDiv, summary.render);
  } else if (path.startsWith('/expenses/')) {
    final id = path.split('/').last;
    shell.renderWithShell(appDiv, (content) => detail.render(content, id));
  } else if (path == '/profile') {
    shell.renderWithShell(appDiv, profile.render);
  } else if (path == '/tokens') {
    shell.renderWithShell(appDiv, tokens.render);
  } else if (path == '/admin/users' || path == '/admin') {
    shell.renderWithShell(appDiv, admin.render);
  } else {
    appDiv.innerHTML = '<p>Page not found</p>'.toJS;
  }
}
