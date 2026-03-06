---
title: "Dart Flutter Integration"
description: Dart patterns for Flutter development including widget lifecycle, state management, BuildContext, navigation, platform channels, and testing Flutter apps
category: explanation
subcategory: prog-lang
tags:
  - dart
  - flutter
  - widgets
  - state-management
  - navigation
  - platform-channels
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__async-programming.md
  - ./ex-soen-prla-da__testing.md
principles:
  - explicit-over-implicit
  - immutability
updated: 2026-01-29
---

# Dart Flutter Integration

## Quick Reference

### Flutter Basics

**Stateless Widget**:

```dart
class ZakatDisplay extends StatelessWidget {
  final double amount;

  const ZakatDisplay({Key? key, required this.amount}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Text('Zakat: \$${amount.toStringAsFixed(2)}');
  }
}
```

**Stateful Widget**:

```dart
class ZakatCalculator extends StatefulWidget {
  const ZakatCalculator({Key? key}) : super(key: key);

  @override
  State<ZakatCalculator> createState() => _ZakatCalculatorState();
}

class _ZakatCalculatorState extends State<ZakatCalculator> {
  double _wealth = 0.0;

  void _updateWealth(double value) {
    setState(() {
      _wealth = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          onChanged: (value) => _updateWealth(double.tryParse(value) ?? 0),
        ),
        Text('Zakat: \$${(_wealth * 0.025).toStringAsFixed(2)}'),
      ],
    );
  }
}
```

## Overview

Flutter is Dart's UI framework for building cross-platform applications. Understanding Flutter-specific Dart patterns is essential for building responsive, performant mobile and web applications.

This guide covers **Flutter with Dart 3.0+** patterns.

## Widget Lifecycle

```dart
class DonationForm extends StatefulWidget {
  const DonationForm({Key? key}) : super(key: key);

  @override
  State<DonationForm> createState() => _DonationFormState();
}

class _DonationFormState extends State<DonationForm> {
  @override
  void initState() {
    super.initState();
    // Initialize state
  }

  @override
  void dispose() {
    // Clean up resources
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
```

## State Management

```dart
// Provider pattern
class ZakatProvider extends ChangeNotifier {
  double _wealth = 0.0;

  double get wealth => _wealth;
  double get zakat => _wealth * 0.025;

  void updateWealth(double value) {
    _wealth = value;
    notifyListeners();
  }
}

// Usage in widget
class ZakatScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ZakatProvider(),
      child: Consumer<ZakatProvider>(
        builder: (context, provider, child) {
          return Text('Zakat: \$${provider.zakat.toStringAsFixed(2)}');
        },
      ),
    );
  }
}
```

## Related Documentation

- [Best Practices](./ex-soen-prla-da__best-practices.md)
- [Async Programming](./ex-soen-prla-da__async-programming.md)
- [Testing](./ex-soen-prla-da__testing.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+ with Flutter 3.0+
