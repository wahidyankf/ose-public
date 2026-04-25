---
title: "Dart API Standards"
description: Authoritative OSE Platform Dart API standards (http, REST, shelf, request-response modeling)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - api-standards
  - http
  - rest
  - shelf
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart API Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to build APIs in THIS codebase, not WHAT REST is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative API standards** for Dart development in the OSE Platform. These standards ensure consistent, secure, and maintainable HTTP APIs across all Dart services.

**Target Audience**: OSE Platform Dart developers building HTTP APIs or consuming external services

**Scope**: http/dio package usage, RESTful conventions, request/response modeling with json_serializable, error response handling, shelf server setup, middleware, pagination

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Generated API Models):

```dart
// Use json_serializable for automated JSON serialization
// Run: dart run build_runner build

@JsonSerializable()
class ZakatPaymentRequest {
  @JsonKey(name: 'customer_id')
  final String customerId;

  final double amount;
  final String currency;

  const ZakatPaymentRequest({
    required this.customerId,
    required this.amount,
    required this.currency,
  });

  // Generated - no manual JSON parsing
  factory ZakatPaymentRequest.fromJson(Map<String, dynamic> json) =>
      _$ZakatPaymentRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ZakatPaymentRequestToJson(this);
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit HTTP Status Codes):

```dart
// CORRECT: Explicit status codes - no magic numbers
Future<Response> createZakatTransaction(Request request) async {
  try {
    final tx = await service.processPayment(request.body);
    return Response(
      201, // Created - explicit
      body: jsonEncode(tx.toJson()),
      headers: {'Content-Type': 'application/json'},
    );
  } on ZakatValidationException catch (e) {
    return Response(
      400, // Bad Request - explicit
      body: jsonEncode({'error': e.message, 'code': 'VALIDATION_ERROR'}),
      headers: {'Content-Type': 'application/json'},
    );
  } on ZakatTransactionNotFoundException {
    return Response(
      404, // Not Found - explicit
      body: jsonEncode({'error': 'Transaction not found'}),
      headers: {'Content-Type': 'application/json'},
    );
  }
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Request/Response Models):

```dart
// CORRECT: Immutable request model
@JsonSerializable()
@immutable
class ZakatHistoryRequest {
  @JsonKey(name: 'customer_id')
  final String customerId;

  final int page;

  @JsonKey(name: 'page_size')
  final int pageSize;

  const ZakatHistoryRequest({
    required this.customerId,
    this.page = 0,
    this.pageSize = 20,
  });

  factory ZakatHistoryRequest.fromJson(Map<String, dynamic> json) =>
      _$ZakatHistoryRequestFromJson(json);
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Request Parsing):

```dart
// Pure function - parse without side effects
ZakatPaymentRequest parsePaymentRequest(Map<String, dynamic> json) {
  return ZakatPaymentRequest.fromJson(json);
}

// Pure function - build response without side effects
Map<String, dynamic> buildSuccessResponse(ZakatTransaction tx) {
  return {
    'id': tx.transactionId,
    'amount': tx.zakatAmount,
    'status': 'completed',
    'timestamp': tx.paidAt.toIso8601String(),
  };
}
```

### 5. Reproducibility First

**PASS Example** (Consistent API Versioning):

```dart
// Version prefix ensures consistent API evolution
const apiV1Prefix = '/api/v1';

Router buildRouter() {
  return Router()
    ..get('$apiV1Prefix/zakat/transactions', listTransactions)
    ..post('$apiV1Prefix/zakat/transactions', createTransaction)
    ..get('$apiV1Prefix/zakat/transactions/<id>', getTransaction)
    ..post('$apiV1Prefix/murabaha/contracts', createContract);
}
```

## Part 1: http Package Usage

### Basic HTTP Client Patterns

**MUST** use `package:http` for simple HTTP requests.

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ZakatApiClient {
  final http.Client _client;
  final Uri _baseUrl;
  final String _apiKey;

  ZakatApiClient({
    required Uri baseUrl,
    required String apiKey,
    http.Client? client,
  })  : _baseUrl = baseUrl,
        _apiKey = apiKey,
        _client = client ?? http.Client();

  // GET request with error handling
  Future<ZakatTransaction> getTransaction(String transactionId) async {
    final uri = _baseUrl.resolve('/api/v1/zakat/transactions/$transactionId');

    final response = await _client.get(
      uri,
      headers: {
        'Authorization': 'Bearer $_apiKey',
        'Accept': 'application/json',
      },
    );

    return switch (response.statusCode) {
      200 => ZakatTransaction.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>,
        ),
      404 => throw ZakatTransactionNotFoundException(transactionId),
      401 => throw UnauthorizedException('Invalid API key'),
      _ => throw ZakatApiException(
          'Unexpected status ${response.statusCode}',
          statusCode: response.statusCode,
        ),
    };
  }

  // POST request
  Future<ZakatTransaction> createTransaction(
    ZakatPaymentRequest request,
  ) async {
    final uri = _baseUrl.resolve('/api/v1/zakat/transactions');

    final response = await _client.post(
      uri,
      headers: {
        'Authorization': 'Bearer $_apiKey',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(request.toJson()),
    );

    return switch (response.statusCode) {
      201 => ZakatTransaction.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>,
        ),
      400 => throw ZakatValidationException.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>,
        ),
      _ => throw ZakatApiException(
          'Failed to create transaction',
          statusCode: response.statusCode,
        ),
    };
  }

  // Always dispose the client
  void dispose() => _client.close();
}
```

### dio for Advanced HTTP

**SHOULD** use `dio` for advanced features: interceptors, multipart uploads, cancellation.

```dart
import 'package:dio/dio.dart';

Dio createZakatDioClient({required String apiKey}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'https://api.oseplatform.com',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  );

  // Auth interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        options.headers['Authorization'] = 'Bearer $apiKey';
        handler.next(options);
      },
      onError: (DioException err, handler) async {
        if (err.response?.statusCode == 401) {
          // Handle token refresh
          await _refreshToken(dio);
          handler.resolve(await dio.fetch(err.requestOptions));
        } else {
          handler.next(err);
        }
      },
    ),
  );

  // Logging interceptor (development only)
  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(
      requestBody: false,  // Never log request body (may contain PII)
      responseBody: false, // Never log response body (may contain PII)
    ));
  }

  return dio;
}
```

## Part 2: Request/Response Modeling

### Standard Request Models

**MUST** use `json_serializable` for all request/response models.

```dart
// zakat_transaction_models.dart

@JsonSerializable()
class CreateZakatTransactionRequest {
  @JsonKey(name: 'customer_id')
  final String customerId;

  final double amount;
  final String currency;

  @JsonKey(name: 'zakat_type')
  final String zakatType;

  @JsonKey(name: 'payment_method')
  final String paymentMethod;

  const CreateZakatTransactionRequest({
    required this.customerId,
    required this.amount,
    required this.currency,
    required this.zakatType,
    required this.paymentMethod,
  });

  factory CreateZakatTransactionRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateZakatTransactionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateZakatTransactionRequestToJson(this);
}

@JsonSerializable()
class ZakatTransactionResponse {
  final String id;

  @JsonKey(name: 'customer_id')
  final String customerId;

  @JsonKey(name: 'zakat_amount')
  final double zakatAmount;

  final String currency;
  final String status;

  @JsonKey(name: 'created_at')
  final DateTime createdAt;

  const ZakatTransactionResponse({
    required this.id,
    required this.customerId,
    required this.zakatAmount,
    required this.currency,
    required this.status,
    required this.createdAt,
  });

  factory ZakatTransactionResponse.fromJson(Map<String, dynamic> json) =>
      _$ZakatTransactionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ZakatTransactionResponseToJson(this);
}
```

### Standard Error Response Model

**MUST** use consistent error response structure across all endpoints.

```dart
@JsonSerializable()
class ApiErrorResponse {
  final String code;
  final String message;
  final Map<String, String>? details; // Field-level validation errors
  final String? traceId;

  const ApiErrorResponse({
    required this.code,
    required this.message,
    this.details,
    this.traceId,
  });

  factory ApiErrorResponse.fromJson(Map<String, dynamic> json) =>
      _$ApiErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ApiErrorResponseToJson(this);

  // Factory methods for common error types
  factory ApiErrorResponse.validationError({
    required Map<String, String> fieldErrors,
    String? traceId,
  }) {
    return ApiErrorResponse(
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: fieldErrors,
      traceId: traceId,
    );
  }

  factory ApiErrorResponse.notFound(String resource) {
    return ApiErrorResponse(
      code: 'NOT_FOUND',
      message: '$resource not found',
    );
  }

  factory ApiErrorResponse.internalError({String? traceId}) {
    return ApiErrorResponse(
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
      traceId: traceId,
    );
  }
}
```

## Part 3: shelf Server Setup

### Basic shelf Server

**MUST** use `shelf` for server-side Dart HTTP servers.

```dart
import 'dart:io';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_router/shelf_router.dart';

// Build the router with all routes
Router buildZakatRouter(ZakatService service) {
  final router = Router();

  // Zakat transactions
  router.get('/api/v1/zakat/transactions', (Request req) =>
      listZakatTransactions(req, service));

  router.post('/api/v1/zakat/transactions', (Request req) =>
      createZakatTransaction(req, service));

  router.get('/api/v1/zakat/transactions/<id>', (Request req, String id) =>
      getZakatTransaction(req, id, service));

  // Murabaha contracts
  router.get('/api/v1/murabaha/contracts', (Request req) =>
      listContracts(req, service));

  router.post('/api/v1/murabaha/contracts', (Request req) =>
      createContract(req, service));

  return router;
}

// Build middleware pipeline
Handler buildHandler(Router router) {
  return Pipeline()
      .addMiddleware(requestLogger())
      .addMiddleware(cors())
      .addMiddleware(contentTypeJson())
      .addMiddleware(authenticate())
      .addMiddleware(errorHandler())
      .addHandler(router.call);
}

// Start the server
Future<void> startServer() async {
  final service = ZakatService(/* dependencies */);
  final router = buildZakatRouter(service);
  final handler = buildHandler(router);

  final server = await shelf_io.serve(
    handler,
    InternetAddress.anyIPv4,
    int.parse(Platform.environment['PORT'] ?? '8080'),
  );

  print('Server running on ${server.address.address}:${server.port}');
}
```

### Route Handlers

**MUST** keep route handlers thin — delegate to service layer.

```dart
// Thin handler - delegates to service
Future<Response> createZakatTransaction(
  Request request,
  ZakatService service,
) async {
  // 1. Parse and validate input
  final Map<String, dynamic> body;
  try {
    body = jsonDecode(await request.readAsString()) as Map<String, dynamic>;
  } on FormatException {
    return _badRequest('Invalid JSON body');
  }

  final CreateZakatTransactionRequest input;
  try {
    input = CreateZakatTransactionRequest.fromJson(body);
  } on TypeError catch (e) {
    return _badRequest('Invalid request format: ${e.message}');
  }

  // 2. Delegate to service
  try {
    final transaction = await service.processPayment(input);
    return Response(
      201,
      body: jsonEncode(transaction.toJson()),
      headers: {'Content-Type': 'application/json'},
    );
  } on ZakatValidationException catch (e) {
    return _badRequest(e.message, code: 'VALIDATION_ERROR');
  } on ZakatServiceUnavailableException {
    return _serviceUnavailable();
  }
}

// Helper response builders
Response _badRequest(String message, {String code = 'BAD_REQUEST'}) {
  return Response(
    400,
    body: jsonEncode(ApiErrorResponse(code: code, message: message).toJson()),
    headers: {'Content-Type': 'application/json'},
  );
}

Response _serviceUnavailable() {
  return Response(
    503,
    body: jsonEncode(ApiErrorResponse.internalError().toJson()),
    headers: {'Content-Type': 'application/json'},
  );
}
```

## Part 4: Middleware Patterns

### Error Handler Middleware

**MUST** implement global error handling middleware to catch unexpected exceptions.

```dart
Middleware errorHandler() {
  return (Handler handler) {
    return (Request request) async {
      try {
        return await handler(request);
      } on ZakatDomainException catch (e) {
        // Domain exceptions: 422 Unprocessable Entity
        return Response(
          422,
          body: jsonEncode(ApiErrorResponse(
            code: e.code ?? 'DOMAIN_ERROR',
            message: e.message,
          ).toJson()),
          headers: {'Content-Type': 'application/json'},
        );
      } catch (e, stackTrace) {
        // Unexpected exceptions: log and return 500
        // IMPORTANT: Do not expose internal error details
        final traceId = _generateTraceId();
        log.severe('Unhandled error [$traceId]', e, stackTrace);

        return Response(
          500,
          body: jsonEncode(ApiErrorResponse.internalError(
            traceId: traceId,
          ).toJson()),
          headers: {'Content-Type': 'application/json'},
        );
      }
    };
  };
}
```

### Authentication Middleware

```dart
Middleware authenticate() {
  return (Handler handler) {
    return (Request request) async {
      // Skip auth for health check
      if (request.url.path == 'health') {
        return handler(request);
      }

      final authHeader = request.headers['authorization'];
      if (authHeader == null || !authHeader.startsWith('Bearer ')) {
        return Response(
          401,
          body: jsonEncode(ApiErrorResponse(
            code: 'UNAUTHORIZED',
            message: 'Authorization header required',
          ).toJson()),
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="OSE Platform API"',
          },
        );
      }

      final token = authHeader.substring(7);
      if (!await _validateToken(token)) {
        return Response(
          403,
          body: jsonEncode(ApiErrorResponse(
            code: 'FORBIDDEN',
            message: 'Invalid or expired token',
          ).toJson()),
          headers: {'Content-Type': 'application/json'},
        );
      }

      return handler(request);
    };
  };
}
```

## Part 5: Pagination

**MUST** implement cursor-based or page-based pagination for collection endpoints.

```dart
@JsonSerializable()
class PaginatedResponse<T> {
  final List<T> data;
  final int total;
  final int page;

  @JsonKey(name: 'page_size')
  final int pageSize;

  @JsonKey(name: 'has_next')
  final bool hasNext;

  @JsonKey(name: 'next_cursor')
  final String? nextCursor;

  const PaginatedResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.pageSize,
    required this.hasNext,
    this.nextCursor,
  });

  Map<String, dynamic> toJson() => _$PaginatedResponseToJson(this);
}

// Handler with pagination
Future<Response> listZakatTransactions(
  Request request,
  ZakatService service,
) async {
  final params = request.url.queryParameters;
  final page = int.tryParse(params['page'] ?? '0') ?? 0;
  final pageSize = (int.tryParse(params['page_size'] ?? '20') ?? 20).clamp(1, 100);

  final result = await service.listTransactions(
    page: page,
    pageSize: pageSize,
  );

  final response = PaginatedResponse(
    data: result.items.map((tx) => tx.toJson()).toList(),
    total: result.totalCount,
    page: page,
    pageSize: pageSize,
    hasNext: (page + 1) * pageSize < result.totalCount,
  );

  return Response.ok(
    jsonEncode(response.toJson()),
    headers: {'Content-Type': 'application/json'},
  );
}
```

## Enforcement

API standards are enforced through:

- **Integration tests** - Test all endpoints with valid and invalid inputs
- **OpenAPI specification** - Document and validate API contracts
- **Code reviews** - Verify consistent error responses, pagination, auth headers

**Pre-commit checklist**:

- [ ] All endpoints return `Content-Type: application/json`
- [ ] Error responses use `ApiErrorResponse` model
- [ ] Request/response models use `json_serializable`
- [ ] Collection endpoints implement pagination
- [ ] HTTP status codes are semantically correct (201 for created, 404 for not found)
- [ ] Authentication checked for all non-public endpoints

## Related Standards

- [Security Standards](./security-standards.md) - Authentication, input validation
- [Error Handling Standards](./error-handling-standards.md) - Exception to HTTP status mapping
- [Concurrency Standards](./concurrency-standards.md) - Async handler patterns
- [Framework Integration](./framework-integration.md) - shelf and dio setup

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**HTTP Stack**: http, dio, shelf, shelf_router, json_serializable
