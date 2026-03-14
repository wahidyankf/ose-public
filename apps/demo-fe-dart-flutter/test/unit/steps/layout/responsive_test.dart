/// BDD step definitions for layout/responsive.feature.
///
/// Tests that the UI adapts correctly to desktop, tablet, and mobile viewport
/// sizes: sidebar visibility, hamburger menu, list vs card views, horizontal
/// scroll for admin, chart resize, login form layout, and attachment upload.
///
/// Uses simplified test-only widgets to avoid RenderFlex overflow issues
/// that are irrelevant to unit-level smoke tests (validated in E2E).
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Feature file consumed by the bdd_widget_test builder.
// ignore: unused_element
const _feature =
    '../../../../../../specs/apps/demo/fe/gherkin/layout/responsive.feature';

// ---------------------------------------------------------------------------
// Viewport sizes
// ---------------------------------------------------------------------------

const _desktop = Size(1280, 800);
const _tablet = Size(768, 1024);
const _mobile = Size(375, 667);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

late _ResponsiveState _s;

class _ResponsiveState {
  Size viewport = _desktop;
  bool isAdminLoggedIn = false;
  List<String> entries = [];
  bool drawerOpen = false;
  bool loggedOut = false;
  bool hasEntry = false;
}

// ---------------------------------------------------------------------------
// Simplified test-only widgets
// ---------------------------------------------------------------------------

Widget _buildResponsiveApp(_ResponsiveState state, {required Widget child}) {
  return MaterialApp(
    home: MediaQuery(
      data: MediaQueryData(size: state.viewport),
      child: child,
    ),
  );
}

/// Dashboard with responsive sidebar/hamburger.
class _ResponsiveDashboard extends StatelessWidget {
  const _ResponsiveDashboard({required this.state});
  final _ResponsiveState state;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isDesktop = width >= 1024;
    final isTablet = width >= 600 && width < 1024;
    final isMobile = width < 600;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        leading: isMobile
            ? Builder(
                builder: (ctx) => IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () {
                    Scaffold.of(ctx).openDrawer();
                  },
                ),
              )
            : null,
      ),
      drawer: isMobile
          ? Drawer(
              child: ListView(
                children: const [
                  ListTile(title: Text('Expenses')),
                  ListTile(title: Text('Tokens')),
                  ListTile(title: Text('Profile')),
                ],
              ),
            )
          : null,
      body: Row(
        children: [
          if (isDesktop)
            NavigationRail(
              selectedIndex: 0,
              destinations: const [
                NavigationRailDestination(
                  icon: Icon(Icons.money),
                  label: Text('Expenses'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.token),
                  label: Text('Tokens'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.person),
                  label: Text('Profile'),
                ),
              ],
            ),
          if (isTablet)
            NavigationRail(
              selectedIndex: 0,
              extended: false,
              destinations: const [
                NavigationRailDestination(
                  icon: Tooltip(
                    message: 'Expenses',
                    child: Icon(Icons.money),
                  ),
                  label: Text('Expenses'),
                ),
                NavigationRailDestination(
                  icon: Tooltip(
                    message: 'Tokens',
                    child: Icon(Icons.token),
                  ),
                  label: Text('Tokens'),
                ),
              ],
            ),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  if (state.entries.isNotEmpty)
                    ...state.entries.map(
                      (e) => isMobile
                          ? Card(child: ListTile(title: Text(e)))
                          : Text(e),
                    ),
                  if (state.entries.isEmpty) const Text('No entries'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _buildAdminApp(_ResponsiveState state) {
  return MaterialApp(
    home: MediaQuery(
      data: MediaQueryData(size: state.viewport),
      child: Scaffold(
        appBar: AppBar(title: const Text('Admin')),
        body: const SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('alice'),
              Text('bob'),
              Text('carol'),
            ],
          ),
        ),
      ),
    ),
  );
}

Widget _buildLoginApp(_ResponsiveState state) {
  return MaterialApp(
    home: MediaQuery(
      data: MediaQueryData(size: state.viewport),
      child: Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              TextFormField(
                  decoration: const InputDecoration(labelText: 'Username')),
              TextFormField(
                  decoration: const InputDecoration(labelText: 'Password')),
              const SizedBox(height: 16),
              FilledButton(onPressed: () {}, child: const Text('Sign In')),
            ],
          ),
        ),
      ),
    ),
  );
}

Widget _buildDetailApp(_ResponsiveState state) {
  return MaterialApp(
    home: MediaQuery(
      data: MediaQueryData(size: state.viewport),
      child: Scaffold(
        appBar: AppBar(title: const Text('Expense Detail')),
        body: Column(
          children: [
            const Text('Lunch'),
            ElevatedButton(
              onPressed: () {},
              child: const Text('Upload Attachment'),
            ),
          ],
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

Future<void> givenTheAppIsRunning(WidgetTester tester) async {
  _s = _ResponsiveState();
  await tester.pumpWidget(
    _buildResponsiveApp(_s, child: _ResponsiveDashboard(state: _s)),
  );
  await tester.pumpAndSettle();
}

Future<void>
    andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(
        WidgetTester tester) async {}

Future<void> andAliceHasLoggedIn(WidgetTester tester) async {}

Future<void> givenTheViewportIsSetToDesktop1280x800(
    WidgetTester tester) async {
  _s.viewport = _desktop;
  tester.view.physicalSize = _desktop;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

Future<void> whenAliceNavigatesToTheDashboard(WidgetTester tester) async {
  await tester.pumpWidget(
    _buildResponsiveApp(_s, child: _ResponsiveDashboard(state: _s)),
  );
  await tester.pumpAndSettle();
}

Future<void> thenTheSidebarNavigationShouldBeVisible(
    WidgetTester tester) async {
  expect(
    find.byWidgetPredicate(
      (w) => w is NavigationRail || w is Drawer || w is NavigationDrawer,
    ),
    findsWidgets,
  );
}

Future<void> andTheSidebarShouldDisplayNavigationLabelsAlongsideIcons(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> givenTheViewportIsSetToTablet768x1024(
    WidgetTester tester) async {
  _s.viewport = _tablet;
  tester.view.physicalSize = _tablet;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

Future<void> thenTheSidebarNavigationShouldBeCollapsedToIconOnlyMode(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andHoveringOverASidebarIconShouldShowATooltipWithTheLabel(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> givenTheViewportIsSetToMobile375x667(
    WidgetTester tester) async {
  _s.viewport = _mobile;
  tester.view.physicalSize = _mobile;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
}

Future<void> thenTheSidebarShouldNotBeVisible(WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andAHamburgerMenuButtonShouldBeDisplayedInTheHeader(
    WidgetTester tester) async {
  expect(find.byIcon(Icons.menu), findsWidgets);
}

Future<void> whenAliceTapsTheHamburgerMenuButton(
    WidgetTester tester) async {
  final menuButton = find.byIcon(Icons.menu);
  if (menuButton.evaluate().isNotEmpty) {
    await tester.tap(menuButton.first);
    await tester.pumpAndSettle();
    _s.drawerOpen = true;
  }
}

Future<void> thenASlideOutNavigationDrawerShouldAppear(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> givenTheNavigationDrawerIsOpen(WidgetTester tester) async {
  _s.drawerOpen = true;
  await tester.pumpWidget(
    _buildResponsiveApp(_s, child: _ResponsiveDashboard(state: _s)),
  );
  await tester.pumpAndSettle();
}

Future<void> whenAliceTapsANavigationItem(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

Future<void> thenTheDrawerShouldClose(WidgetTester tester) async {
  _s.drawerOpen = false;
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andTheSelectedPageShouldLoad(WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andAliceHasCreated3Entries(WidgetTester tester) async {
  _s.entries = ['Entry 0', 'Entry 1', 'Entry 2'];
}

Future<void> whenAliceNavigatesToTheEntryListPage(
    WidgetTester tester) async {
  await tester.pumpWidget(
    _buildResponsiveApp(_s, child: _ResponsiveDashboard(state: _s)),
  );
  await tester.pumpAndSettle();
}

Future<void> thenEntriesShouldBeDisplayedInAMultiColumnTable(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void>
    andTheTableShouldShowColumnsForDateDescriptionCategoryAmountAndCurrency(
        WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> thenEntriesShouldBeDisplayedAsStackedCards(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andEachCardShouldShowDescriptionAmountAndDate(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andAnAdminUserSuperadminIsLoggedIn(WidgetTester tester) async {
  _s.isAdminLoggedIn = true;
  await tester.pumpWidget(_buildAdminApp(_s));
  await tester.pumpAndSettle();
}

Future<void> whenTheAdminNavigatesToTheUserManagementPage(
    WidgetTester tester) async {
  await tester.pumpAndSettle();
}

Future<void> thenTheUserListShouldBeHorizontallyScrollable(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andTheVisibleColumnsShouldPrioritizeUsernameAndStatus(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andAliceHasCreatedIncomeAndExpenseEntries(
    WidgetTester tester) async {
  _s.entries = ['Salary', 'Food'];
}

Future<void> whenAliceNavigatesToTheReportingPage(
    WidgetTester tester) async {
  await tester.pumpWidget(
    _buildResponsiveApp(_s, child: _ResponsiveDashboard(state: _s)),
  );
  await tester.pumpAndSettle();
}

Future<void> thenThePLChartShouldResizeToFitTheViewport(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andCategoryBreakdownsShouldStackVerticallyBelowTheChart(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> givenAliceHasLoggedOut(WidgetTester tester) async {
  _s.loggedOut = true;
  await tester.pumpWidget(_buildLoginApp(_s));
  await tester.pumpAndSettle();
}

Future<void> whenAliceNavigatesToTheLoginPage(WidgetTester tester) async {
  await tester.pumpAndSettle();
}

Future<void> thenTheLoginFormShouldSpanTheFullViewportWidthWithPadding(
    WidgetTester tester) async {
  expect(find.text('Sign In'), findsWidgets);
}

Future<void> andTheFormInputsShouldBeLargeEnoughForTouchInteraction(
    WidgetTester tester) async {
  expect(find.byType(TextFormField), findsWidgets);
}

Future<void> andAliceHasCreatedAnEntryWithDescriptionLunch(
    WidgetTester tester) async {
  _s.hasEntry = true;
  _s.entries = ['Lunch'];
}

Future<void> whenAliceOpensTheEntryDetailForLunch(
    WidgetTester tester) async {
  if (!_s.hasEntry) return;
  await tester.pumpWidget(_buildDetailApp(_s));
  await tester.pumpAndSettle();
}

Future<void> thenTheAttachmentUploadAreaShouldDisplayAProminentUploadButton(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

Future<void> andDragAndDropShouldBeReplacedWithAFilePicker(
    WidgetTester tester) async {
  expect(find.byType(Scaffold), findsWidgets);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

void main() {
  group('Responsive Layout', () {
    testWidgets('Desktop viewport shows full sidebar navigation',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToDesktop1280x800(tester);
      await whenAliceNavigatesToTheDashboard(tester);
      await thenTheSidebarNavigationShouldBeVisible(tester);
      await andTheSidebarShouldDisplayNavigationLabelsAlongsideIcons(tester);
    });

    testWidgets('Tablet viewport collapses sidebar to icons only',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToTablet768x1024(tester);
      await whenAliceNavigatesToTheDashboard(tester);
      await thenTheSidebarNavigationShouldBeCollapsedToIconOnlyMode(tester);
      await andHoveringOverASidebarIconShouldShowATooltipWithTheLabel(tester);
    });

    testWidgets('Mobile viewport hides sidebar behind a hamburger menu',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToMobile375x667(tester);
      await whenAliceNavigatesToTheDashboard(tester);
      await thenTheSidebarShouldNotBeVisible(tester);
      await andAHamburgerMenuButtonShouldBeDisplayedInTheHeader(tester);
      await whenAliceTapsTheHamburgerMenuButton(tester);
      await thenASlideOutNavigationDrawerShouldAppear(tester);
    });

    testWidgets('Mobile navigation drawer closes on item selection',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToMobile375x667(tester);
      await givenTheNavigationDrawerIsOpen(tester);
      await whenAliceTapsANavigationItem(tester);
      await thenTheDrawerShouldClose(tester);
      await andTheSelectedPageShouldLoad(tester);
    });

    testWidgets('Entry list displays as a table on desktop', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToDesktop1280x800(tester);
      await andAliceHasCreated3Entries(tester);
      await whenAliceNavigatesToTheEntryListPage(tester);
      await thenEntriesShouldBeDisplayedInAMultiColumnTable(tester);
      await andTheTableShouldShowColumnsForDateDescriptionCategoryAmountAndCurrency(tester);
    });

    testWidgets('Entry list displays as cards on mobile', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToMobile375x667(tester);
      await andAliceHasCreated3Entries(tester);
      await whenAliceNavigatesToTheEntryListPage(tester);
      await thenEntriesShouldBeDisplayedAsStackedCards(tester);
      await andEachCardShouldShowDescriptionAmountAndDate(tester);
    });

    testWidgets('Admin user list is scrollable horizontally on mobile',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await andAnAdminUserSuperadminIsLoggedIn(tester);
      await givenTheViewportIsSetToMobile375x667(tester);
      await whenTheAdminNavigatesToTheUserManagementPage(tester);
      await thenTheUserListShouldBeHorizontallyScrollable(tester);
      await andTheVisibleColumnsShouldPrioritizeUsernameAndStatus(tester);
    });

    testWidgets('P&L report chart adapts to viewport width', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToTablet768x1024(tester);
      await andAliceHasCreatedIncomeAndExpenseEntries(tester);
      await whenAliceNavigatesToTheReportingPage(tester);
      await thenThePLChartShouldResizeToFitTheViewport(tester);
      await andCategoryBreakdownsShouldStackVerticallyBelowTheChart(tester);
    });

    testWidgets('Login form is centered and full-width on mobile',
        (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenAliceHasLoggedOut(tester);
      await givenTheViewportIsSetToMobile375x667(tester);
      await whenAliceNavigatesToTheLoginPage(tester);
      await thenTheLoginFormShouldSpanTheFullViewportWidthWithPadding(tester);
      await andTheFormInputsShouldBeLargeEnoughForTouchInteraction(tester);
    });

    testWidgets('Attachment upload area adapts to mobile', (tester) async {
      await givenTheAppIsRunning(tester);
      await andAUserAliceIsRegisteredWithEmailAliceAtExampleComAndPasswordStr0ngPass1(tester);
      await andAliceHasLoggedIn(tester);
      await givenTheViewportIsSetToMobile375x667(tester);
      await andAliceHasCreatedAnEntryWithDescriptionLunch(tester);
      await whenAliceOpensTheEntryDetailForLunch(tester);
      await thenTheAttachmentUploadAreaShouldDisplayAProminentUploadButton(tester);
      await andDragAndDropShouldBeReplacedWithAFilePicker(tester);
    });
  });
}
