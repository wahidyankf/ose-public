---
title: "Dart Security"
description: Security best practices for Dart including input validation, SQL injection prevention, XSS prevention, authentication, secure storage, HTTPS, secrets management, and OWASP Mobile Top 10
category: explanation
subcategory: prog-lang
tags:
  - dart
  - security
  - validation
  - authentication
  - encryption
  - owasp
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__flutter.md
  - ./ex-soen-prla-da__server-side.md
principles:
  - explicit-over-implicit
updated: 2026-01-29
---

# Dart Security

## Quick Reference

### Security Best Practices

**Input Validation**:

```dart
double validateDonationAmount(String input) {
  final amount = double.tryParse(input);

  if (amount == null) {
    throw FormatException('Invalid amount format');
  }

  if (amount <= 0) {
    throw ArgumentError('Amount must be positive');
  }

  if (amount > 1000000) {
    throw ArgumentError('Amount exceeds maximum');
  }

  return amount;
}
```

**SQL Injection Prevention**:

```dart
// ✅ Use parameterized queries
Future<Donation?> findDonation(String donorId) async {
  final result = await db.query(
    'donations',
    where: 'donor_id = ?',
    whereArgs: [donorId], // Parameterized
  );
  return result.isNotEmpty ? Donation.fromMap(result.first) : null;
}

// ❌ Never concatenate strings
Future<Donation?> findDonationUnsafe(String donorId) async {
  // NEVER DO THIS
  final sql = 'SELECT * FROM donations WHERE donor_id = "$donorId"';
  // SQL injection vulnerable!
}
```

**Password Hashing**:

```dart
import 'package:crypto/crypto.dart';
import 'dart:convert';

String hashPassword(String password) {
  final bytes = utf8.encode(password);
  final hash = sha256.convert(bytes);
  return hash.toString();
}
```

## Overview

Security is paramount in financial applications. Dart provides security features and best practices to protect sensitive financial data, prevent attacks, and ensure compliance.

This guide covers **Dart 3.0+ security** best practices for financial applications.

## Input Validation

```dart
class DonationValidator {
  void validate(Donation donation) {
    _validateAmount(donation.amount);
    _validateDonorId(donation.donorId);
  }

  void _validateAmount(double amount) {
    if (amount <= 0) {
      throw ValidationException('Amount must be positive');
    }

    if (amount > 1000000) {
      throw ValidationException('Amount exceeds maximum \$1,000,000');
    }
  }

  void _validateDonorId(String donorId) {
    if (donorId.isEmpty) {
      throw ValidationException('Donor ID is required');
    }

    if (!RegExp(r'^[a-zA-Z0-9-]+$').hasMatch(donorId)) {
      throw ValidationException('Invalid donor ID format');
    }
  }
}

class ValidationException implements Exception {
  final String message;
  ValidationException(this.message);
}
```

## Authentication

```dart
class AuthService {
  Future<String?> authenticate(String username, String password) async {
    final hashedPassword = _hashPassword(password);
    final user = await _findUser(username, hashedPassword);

    if (user != null) {
      return _generateToken(user);
    }

    return null;
  }

  String _hashPassword(String password) {
    // Use proper password hashing (bcrypt, scrypt, etc.)
    return sha256.convert(utf8.encode(password)).toString();
  }

  Future<User?> _findUser(String username, String hashedPassword) async {
    // Database lookup
    return null;
  }

  String _generateToken(User user) {
    // Generate JWT token
    return 'token-${user.id}';
  }
}

class User {
  final String id;
  User(this.id);
}
```

## Secure Storage

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final storage = FlutterSecureStorage();

  Future<void> saveApiKey(String key) async {
    await storage.write(key: 'api_key', value: key);
  }

  Future<String?> getApiKey() async {
    return await storage.read(key: 'api_key');
  }

  Future<void> deleteApiKey() async {
    await storage.delete(key: 'api_key');
  }
}
```

## Related Documentation

- [Best Practices](./ex-soen-prla-da__best-practices.md)
- [Flutter Integration](./ex-soen-prla-da__flutter.md)
- [Server-Side Dart](./ex-soen-prla-da__server-side.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
