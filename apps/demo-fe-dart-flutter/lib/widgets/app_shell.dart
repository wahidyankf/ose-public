/// Responsive application shell providing consistent layout.
///
/// Renders a persistent sidebar on desktop (>1024 px), an icon-only rail on
/// tablet (768-1024 px), and a bottom-drawer navigation on mobile (<768 px).
/// The AppBar shows the current user's display name and a logout action.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:demo_fe_dart_flutter/core/providers/auth_provider.dart';
import 'package:demo_fe_dart_flutter/core/providers/user_provider.dart';

// ---------------------------------------------------------------------------
// Break-point constants
// ---------------------------------------------------------------------------

const double _kTabletBreak = 768;
const double _kDesktopBreak = 1024;

// ---------------------------------------------------------------------------
// Navigation destination model
// ---------------------------------------------------------------------------

class _NavDest {
  const _NavDest({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.route,
    this.adminOnly = false,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final String route;
  final bool adminOnly;
}

const List<_NavDest> _destinations = [
  _NavDest(
    icon: Icons.dashboard_outlined,
    selectedIcon: Icons.dashboard,
    label: 'Expenses',
    route: '/expenses',
  ),
  _NavDest(
    icon: Icons.bar_chart_outlined,
    selectedIcon: Icons.bar_chart,
    label: 'Summary',
    route: '/expenses/summary',
  ),
  _NavDest(
    icon: Icons.token_outlined,
    selectedIcon: Icons.token,
    label: 'Tokens',
    route: '/tokens',
  ),
  _NavDest(
    icon: Icons.person_outlined,
    selectedIcon: Icons.person,
    label: 'Profile',
    route: '/profile',
  ),
  _NavDest(
    icon: Icons.admin_panel_settings_outlined,
    selectedIcon: Icons.admin_panel_settings,
    label: 'Admin',
    route: '/admin',
    adminOnly: true,
  ),
];

// ---------------------------------------------------------------------------
// AppShell widget
// ---------------------------------------------------------------------------

/// Wraps [child] in the application chrome (AppBar + navigation).
///
/// Reads [currentUserProvider] to display the user's name and determine
/// whether the Admin link is visible (role == 'ADMIN').
class AppShell extends ConsumerWidget {
  const AppShell({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final currentRoute = GoRouterState.of(context).matchedLocation;
    final isAdmin = userAsync.valueOrNull?.role == 'ADMIN';

    final visibleDests = _destinations
        .where((d) => !d.adminOnly || isAdmin)
        .toList(growable: false);

    final selectedIndex = _indexForRoute(visibleDests, currentRoute);

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        if (width >= _kDesktopBreak) {
          return _DesktopLayout(
            destinations: visibleDests,
            selectedIndex: selectedIndex,
            userAsync: userAsync,
            ref: ref,
            child: child,
          );
        }
        if (width >= _kTabletBreak) {
          return _TabletLayout(
            destinations: visibleDests,
            selectedIndex: selectedIndex,
            userAsync: userAsync,
            ref: ref,
            child: child,
          );
        }
        return _MobileLayout(
          destinations: visibleDests,
          selectedIndex: selectedIndex,
          userAsync: userAsync,
          ref: ref,
          child: child,
        );
      },
    );
  }

  int _indexForRoute(List<_NavDest> dests, String currentRoute) {
    for (var i = 0; i < dests.length; i++) {
      if (currentRoute == dests[i].route ||
          currentRoute.startsWith('${dests[i].route}/')) {
        return i;
      }
    }
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Shared header / logout helpers
// ---------------------------------------------------------------------------

AppBar _buildAppBar(
  BuildContext context,
  WidgetRef ref,
  AsyncValue<dynamic> userAsync, {
  Widget? leading,
}) {
  final displayName = userAsync.maybeWhen(
    data: (u) => (u.displayName as String?)?.isNotEmpty == true
        ? u.displayName as String
        : u.username as String,
    orElse: () => '',
  );

  return AppBar(
    leading: leading,
    title: const Text('Demo Frontend'),
    actions: [
      if (displayName.isNotEmpty)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Center(
            child: Text(
              displayName,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ),
      IconButton(
        tooltip: 'Logout',
        icon: const Icon(Icons.logout),
        onPressed: () => _logout(context, ref),
      ),
    ],
  );
}

Future<void> _logout(BuildContext context, WidgetRef ref) async {
  await ref.read(authProvider.notifier).logout();
  if (context.mounted) {
    context.go('/login');
  }
}

void _navigate(BuildContext context, List<_NavDest> dests, int index) {
  if (index < dests.length) {
    context.go(dests[index].route);
  }
}

// ---------------------------------------------------------------------------
// Desktop layout — persistent drawer sidebar
// ---------------------------------------------------------------------------

class _DesktopLayout extends StatelessWidget {
  const _DesktopLayout({
    required this.child,
    required this.destinations,
    required this.selectedIndex,
    required this.userAsync,
    required this.ref,
  });

  final Widget child;
  final List<_NavDest> destinations;
  final int selectedIndex;
  final AsyncValue<dynamic> userAsync;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context, ref, userAsync),
      body: Row(
        children: [
          NavigationDrawer(
            selectedIndex: selectedIndex,
            onDestinationSelected: (i) => _navigate(context, destinations, i),
            children: [
              const SizedBox(height: 12),
              ...destinations.map(
                (d) => NavigationDrawerDestination(
                  icon: Icon(d.icon),
                  selectedIcon: Icon(d.selectedIcon),
                  label: Text(d.label),
                ),
              ),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: child),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tablet layout — icon-only NavigationRail
// ---------------------------------------------------------------------------

class _TabletLayout extends StatelessWidget {
  const _TabletLayout({
    required this.child,
    required this.destinations,
    required this.selectedIndex,
    required this.userAsync,
    required this.ref,
  });

  final Widget child;
  final List<_NavDest> destinations;
  final int selectedIndex;
  final AsyncValue<dynamic> userAsync;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context, ref, userAsync),
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: selectedIndex,
            onDestinationSelected: (i) => _navigate(context, destinations, i),
            labelType: NavigationRailLabelType.none,
            destinations: destinations
                .map(
                  (d) => NavigationRailDestination(
                    icon: Tooltip(message: d.label, child: Icon(d.icon)),
                    selectedIcon: Icon(d.selectedIcon),
                    label: Text(d.label),
                  ),
                )
                .toList(),
          ),
          const VerticalDivider(width: 1),
          Expanded(child: child),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Mobile layout — hamburger drawer
// ---------------------------------------------------------------------------

class _MobileLayout extends StatelessWidget {
  const _MobileLayout({
    required this.child,
    required this.destinations,
    required this.selectedIndex,
    required this.userAsync,
    required this.ref,
  });

  final Widget child;
  final List<_NavDest> destinations;
  final int selectedIndex;
  final AsyncValue<dynamic> userAsync;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context, ref, userAsync),
      drawer: NavigationDrawer(
        selectedIndex: selectedIndex,
        onDestinationSelected: (i) {
          Navigator.of(context).pop();
          _navigate(context, destinations, i);
        },
        children: [
          const SizedBox(height: 12),
          ...destinations.map(
            (d) => NavigationDrawerDestination(
              icon: Icon(d.icon),
              selectedIcon: Icon(d.selectedIcon),
              label: Text(d.label),
            ),
          ),
        ],
      ),
      body: child,
    );
  }
}
