---
title: "Dart Security Standards"
description: Authoritative OSE Platform Dart security standards (input-validation, encryption, secure-storage)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - security
  - input-validation
  - encryption
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Security Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to implement security in THIS codebase, not WHAT security is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative security standards** for Dart development in the OSE Platform. Security is non-negotiable — financial and personal data from Zakat and Murabaha operations requires the highest protection.

**Target Audience**: OSE Platform Dart developers, security reviewers

**Scope**: Input validation, PII protection, `flutter_secure_storage`, `dart:crypto`, HTTP security, SQL injection prevention, JSON deserialization safety

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Security Scanning):

```yaml
# .github/workflows/security.yaml
- name: Check for security advisories
  run: dart pub audit

- name: Lint for security anti-patterns
  run: dart analyze --fatal-infos
  # analysis_options.yaml includes security-focused rules:
  # - avoid_dynamic_calls (prevents injection)
  # - always_declare_return_types (explicit API contracts)
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Security Boundaries):

```dart
// CORRECT: Explicit sanitization at boundary
class ZakatPaymentHandler {
  // Explicit: sanitize at input boundary
  Future<void> processPayment(Map<String, dynamic> rawInput) async {
    // Validate and sanitize explicitly before domain processing
    final validated = ZakatPaymentInput.fromUntrustedJson(rawInput);
    await _processValidatedPayment(validated);
  }

  // Private: operates only on validated data
  Future<void> _processValidatedPayment(ZakatPaymentInput input) async {
    // No validation needed here - type guarantees safety
    await transactionService.record(
      customerId: input.customerId,
      amount: input.amount,
    );
  }
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Validated Input):

```dart
// CORRECT: Once validated, input is immutable - cannot be tampered with
@immutable
class ValidatedZakatInput {
  final String customerId;     // Validated: non-empty, matches pattern
  final double amount;          // Validated: positive, within limits
  final String currency;        // Validated: known currency code

  const ValidatedZakatInput._({
    required this.customerId,
    required this.amount,
    required this.currency,
  });

  // Factory validates and creates immutable instance
  factory ValidatedZakatInput.fromRaw({
    required String customerId,
    required double amount,
    required String currency,
  }) {
    _validateCustomerId(customerId);
    _validateAmount(amount);
    _validateCurrency(currency);

    return ValidatedZakatInput._(
      customerId: customerId,
      amount: amount,
      currency: currency,
    );
  }

  static void _validateCustomerId(String id) {
    if (id.isEmpty || id.length > 50) {
      throw SecurityValidationException('Invalid customer ID format');
    }
    if (!RegExp(r'^[a-zA-Z0-9\-]+$').hasMatch(id)) {
      throw SecurityValidationException('Customer ID contains invalid characters');
    }
  }

  static void _validateAmount(double amount) {
    if (amount <= 0 || amount > 1000000) {
      throw SecurityValidationException('Amount out of valid range');
    }
    if (amount.isNaN || amount.isInfinite) {
      throw SecurityValidationException('Amount must be a finite number');
    }
  }

  static void _validateCurrency(String currency) {
    const validCurrencies = {'USD', 'SAR', 'MYR', 'IDR', 'EUR', 'GBP'};
    if (!validCurrencies.contains(currency)) {
      throw SecurityValidationException('Unsupported currency: $currency');
    }
  }
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Validation Functions):

```dart
// Pure validation - no side effects, fully testable
bool isValidCustomerId(String customerId) {
  if (customerId.isEmpty || customerId.length > 50) return false;
  return RegExp(r'^[a-zA-Z0-9\-]+$').hasMatch(customerId);
}

bool isValidZakatAmount(double amount) {
  return amount > 0 && amount <= 1000000 && !amount.isNaN && !amount.isInfinite;
}

String sanitizeForLog(String input) {
  // Remove PII patterns from log messages (pure transformation)
  return input
      .replaceAll(RegExp(r'\b\d{16}\b'), '****-****-****-****') // Card numbers
      .replaceAll(RegExp(r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b',
          caseSensitive: false), '[EMAIL_REDACTED]');
}
```

### 5. Reproducibility First

**PASS Example** (Reproducible Security Configuration):

```dart
// CORRECT: Security config from environment - not hardcoded
class SecurityConfig {
  final int maxPaymentAmount;
  final Duration sessionTimeout;
  final List<String> allowedOrigins;

  const SecurityConfig({
    required this.maxPaymentAmount,
    required this.sessionTimeout,
    required this.allowedOrigins,
  });

  factory SecurityConfig.fromEnvironment() {
    return SecurityConfig(
      maxPaymentAmount: int.parse(
        Platform.environment['MAX_PAYMENT_AMOUNT'] ?? '100000',
      ),
      sessionTimeout: Duration(
        minutes: int.parse(
          Platform.environment['SESSION_TIMEOUT_MINUTES'] ?? '30',
        ),
      ),
      allowedOrigins:
          (Platform.environment['ALLOWED_ORIGINS'] ?? 'https://oseplatform.com')
              .split(','),
    );
  }
}
```

## Part 1: Input Validation

### Validate at System Boundaries

**MUST** validate all external input at the system boundary (HTTP handlers, CLI args, file parsing).

```dart
// CORRECT: Validate at HTTP handler boundary
Future<Response> zakatPaymentHandler(Request request) async {
  // 1. Parse with safety
  final Map<String, dynamic> rawBody;
  try {
    rawBody = jsonDecode(await request.readAsString()) as Map<String, dynamic>;
  } on FormatException {
    return Response.badRequest(
      body: jsonEncode({'error': 'Invalid JSON body'}),
    );
  }

  // 2. Validate required fields
  final customerId = rawBody['customer_id'];
  if (customerId is! String || customerId.isEmpty) {
    return Response.badRequest(
      body: jsonEncode({'error': 'customer_id must be a non-empty string'}),
    );
  }

  final rawAmount = rawBody['amount'];
  if (rawAmount is! num) {
    return Response.badRequest(
      body: jsonEncode({'error': 'amount must be a number'}),
    );
  }

  final amount = rawAmount.toDouble();
  if (amount <= 0 || amount > 1000000) {
    return Response.badRequest(
      body: jsonEncode({'error': 'amount must be between 0 and 1,000,000'}),
    );
  }

  // 3. Use validated input
  final validatedInput = ValidatedZakatInput.fromRaw(
    customerId: customerId,
    amount: amount,
    currency: (rawBody['currency'] as String?) ?? 'USD',
  );

  final result = await zakatService.processPayment(validatedInput);
  return Response.ok(jsonEncode(result.toJson()));
}
```

### Whitelist Over Blacklist

**MUST** validate against allowed values (whitelist) rather than rejecting known bad values (blacklist).

```dart
// WRONG: Blacklist approach - misses edge cases
bool isValidCurrency(String currency) {
  return !['DROP', 'NULL', 'SELECT', 'admin'].contains(currency); // Missing cases!
}

// CORRECT: Whitelist approach
bool isValidCurrency(String currency) {
  const allowedCurrencies = {'USD', 'SAR', 'MYR', 'IDR', 'EUR', 'GBP', 'SGD'};
  return allowedCurrencies.contains(currency);
}

// CORRECT: Whitelist for transaction types
bool isValidZakatType(String type) {
  const allowedTypes = {'zakat_mal', 'zakat_fitrah', 'zakat_emas', 'zakat_perak'};
  return allowedTypes.contains(type);
}
```

## Part 2: Never Log Sensitive Data

**PROHIBITED**: Logging PII (Personally Identifiable Information) or financial data.

```dart
import 'dart:developer' as developer;

// WRONG: Logging sensitive data
void processPayment(String customerId, double amount, String accountNumber) {
  developer.log('Processing payment for customer $customerId, '
      'account $accountNumber, amount $amount'); // PII in logs!
}

// CORRECT: Log only non-sensitive identifiers
void processPayment(String customerId, double amount, String accountNumber) {
  developer.log(
    'Processing zakat payment',
    name: 'ZakatService',
    // Log transaction context, not PII
    error: {'customerId_prefix': customerId.substring(0, 4), 'hasAccount': true},
  );

  // Process...

  developer.log(
    'Zakat payment recorded successfully',
    name: 'ZakatService',
  );
}

// CORRECT: Sanitize before logging
void logZakatEvent(String message, Map<String, dynamic> context) {
  final sanitized = context.map((key, value) {
    // Redact sensitive fields
    if (['amount', 'account_number', 'nric', 'email'].contains(key)) {
      return MapEntry(key, '[REDACTED]');
    }
    return MapEntry(key, value);
  });

  developer.log(message, name: 'ZakatApp', error: sanitized);
}
```

## Part 3: flutter_secure_storage

**MUST** use `flutter_secure_storage` for storing sensitive data (tokens, keys, credentials) in Flutter apps.

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true, // AES encryption on Android
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const _authTokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';

  // Store sensitive token
  Future<void> saveAuthToken(String token) async {
    await _storage.write(key: _authTokenKey, value: token);
  }

  Future<String?> getAuthToken() async {
    return _storage.read(key: _authTokenKey);
  }

  // Always clear on logout
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}

// WRONG: Using SharedPreferences for sensitive data
class InsecureTokenStorage {
  Future<void> saveAuthToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token); // Unencrypted! Wrong!
  }
}
```

## Part 4: Cryptographic Operations

**MUST** use `dart:crypto` or `pointycastle` package for hashing. Never implement custom cryptography.

```dart
import 'dart:convert';
import 'package:crypto/crypto.dart'; // pub.dev: crypto package

// CORRECT: SHA-256 hashing for audit trail integrity
String computeTransactionHash(ZakatTransaction transaction) {
  final data = jsonEncode({
    'transactionId': transaction.transactionId,
    'payerId': transaction.payerId,
    'amount': transaction.zakatAmount,
    'timestamp': transaction.paidAt.toIso8601String(),
  });

  final bytes = utf8.encode(data);
  final digest = sha256.convert(bytes);
  return digest.toString();
}

// CORRECT: HMAC for request signing
String signRequest(String payload, String secretKey) {
  final key = utf8.encode(secretKey);
  final bytes = utf8.encode(payload);
  final hmac = Hmac(sha256, key);
  final digest = hmac.convert(bytes);
  return digest.toString();
}

// WRONG: MD5 for security (only acceptable for non-security checksums)
String insecureHash(String data) {
  return md5.convert(utf8.encode(data)).toString(); // MD5 is broken for security!
}

// WRONG: Storing passwords in plain text or with weak hash
Future<void> storePassword(String password) async {
  await _storage.write(key: 'password', value: password); // Plain text!
  // Should use bcrypt/argon2 for password hashing
}
```

## Part 5: HTTP Security

### Certificate Pinning with dio

**SHOULD** implement certificate pinning for API clients in production Flutter apps.

```dart
import 'package:dio/dio.dart';
import 'dart:io';

// CORRECT: Certificate pinning with dio
Dio createSecureClient() {
  final dio = Dio();

  // Certificate pinning
  (dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate =
      (HttpClient client) {
    client.badCertificateCallback = (cert, host, port) {
      // Verify certificate fingerprint
      final expectedFingerprint = 'SHA256:your-expected-fingerprint-here';
      return cert.der.toString() == expectedFingerprint;
    };
    return client;
  };

  // Security headers
  dio.options.headers = {
    'Accept': 'application/json',
    'X-API-Version': '1',
  };

  return dio;
}

// CORRECT: Dio interceptor for auth token injection
class AuthInterceptor extends Interceptor {
  final SecureTokenStorage _storage;

  AuthInterceptor(this._storage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAuthToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      // Token expired - refresh or logout
      await _storage.clearAll();
    }
    handler.next(err);
  }
}
```

## Part 6: SQL Injection Prevention

**MUST** use parameterized queries. Never construct SQL with string interpolation.

```dart
import 'package:sqlite3/sqlite3.dart';

// WRONG: SQL injection vulnerability
Future<ZakatTransaction?> findTransaction(String customerId) async {
  final sql = 'SELECT * FROM transactions WHERE customer_id = "$customerId"';
  // If customerId = '" OR "1"="1' -> SQL injection!
  return db.query(sql);
}

// CORRECT: Parameterized query
Future<ZakatTransaction?> findTransaction(String customerId) async {
  final result = db.select(
    'SELECT * FROM transactions WHERE customer_id = ?', // Parameterized
    [customerId], // Safe: escaped by database driver
  );

  if (result.isEmpty) return null;
  return ZakatTransaction.fromRow(result.first);
}

// CORRECT: For drift ORM (type-safe queries)
Future<List<ZakatTransactionRow>> findByCustomer(String customerId) {
  return (select(zakatTransactions)
    ..where((t) => t.customerId.equals(customerId))) // Type-safe, not SQL string
    .get();
}
```

## Part 7: JSON Deserialization Safety

**MUST** use safe JSON deserialization with type checking.

```dart
// WRONG: Unsafe JSON access
Map<String, dynamic> rawJson = jsonDecode(response.body) as Map<String, dynamic>;
final wealth = rawJson['wealth'] as double; // Throws if null or wrong type!
final customerId = rawJson['customer_id']; // dynamic - no type safety

// CORRECT: Safe JSON deserialization with explicit type checks
ZakatPaymentRequest parseZakatPayment(String jsonBody) {
  final Map<String, dynamic> json;
  try {
    json = jsonDecode(jsonBody) as Map<String, dynamic>;
  } on FormatException catch (e) {
    throw ZakatParseException('Invalid JSON: ${e.message}');
  } on TypeError {
    throw ZakatParseException('JSON must be an object');
  }

  final customerId = json['customer_id'];
  if (customerId is! String || customerId.isEmpty) {
    throw ZakatParseException('customer_id must be a non-empty string');
  }

  final rawWealth = json['wealth'];
  if (rawWealth is! num) {
    throw ZakatParseException('wealth must be a number');
  }

  return ZakatPaymentRequest(
    customerId: customerId,
    wealth: rawWealth.toDouble(),
  );
}

// BEST: Use json_serializable (type-safe, generated)
@JsonSerializable()
class ZakatPaymentRequest {
  @JsonKey(name: 'customer_id')
  final String customerId;
  final double wealth;

  const ZakatPaymentRequest({required this.customerId, required this.wealth});

  factory ZakatPaymentRequest.fromJson(Map<String, dynamic> json) =>
      _$ZakatPaymentRequestFromJson(json); // Generated - type-safe

  Map<String, dynamic> toJson() => _$ZakatPaymentRequestToJson(this);
}
```

## Enforcement

Security standards are enforced through:

- **dart pub audit** - Weekly automated security advisory scan
- **dart analyze** - Static analysis for security anti-patterns
- **Code reviews** - Security checklist for every PR touching input handling
- **Penetration testing** - Quarterly review of API endpoints

**Pre-commit security checklist**:

- [ ] All external input validated at system boundary
- [ ] No PII or financial data in log statements
- [ ] Secrets stored in `flutter_secure_storage` (not `SharedPreferences`)
- [ ] SQL queries use parameterization (no string interpolation)
- [ ] JSON deserialization uses type-safe approach (`json_serializable` preferred)
- [ ] No custom cryptography (use `dart:crypto` or `pointycastle`)
- [ ] `dart pub audit` shows no critical advisories

## Related Standards

- [API Standards](./api-standards.md) - HTTP security headers, authentication
- [Build Configuration](./build-configuration.md) - dart pub audit in CI
- [Error Handling Standards](./error-handling-standards.md) - Security exception types
- [Type Safety Standards](./type-safety-standards.md) - Type safety prevents injection

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**Security Tools**: dart pub audit, flutter_secure_storage, dart:crypto, dio with certificate pinning
