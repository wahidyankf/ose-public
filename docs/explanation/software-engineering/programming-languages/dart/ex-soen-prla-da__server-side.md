---
title: "Dart Server-Side Development"
description: Building server applications with Dart using shelf package, routing, middleware, JSON serialization, database integration, RESTful APIs, WebSocket support, authentication, and deployment
category: explanation
subcategory: prog-lang
tags:
  - dart
  - server-side
  - shelf
  - rest-api
  - backend
  - middleware
related:
  - ./ex-soen-prla-da__best-practices.md
  - ./ex-soen-prla-da__async-programming.md
  - ./ex-soen-prla-da__security.md
principles:
  - explicit-over-implicit
updated: 2026-01-29
---

# Dart Server-Side Development

## Quick Reference

### Basic Shelf Server

```dart
import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;

Future<void> main() async {
  final handler = Pipeline()
      .addMiddleware(logRequests())
      .addHandler(_router);

  final server = await io.serve(handler, 'localhost', 8080);
  print('Server running on localhost:${server.port}');
}

Response _router(Request request) {
  if (request.url.path == 'zakat' && request.method == 'POST') {
    return _calculateZakat(request);
  }

  return Response.notFound('Not found');
}

Future<Response> _calculateZakat(Request request) async {
  try {
    final payload = jsonDecode(await request.readAsString());
    final wealth = (payload['wealth'] as num).toDouble();
    final nisab = (payload['nisab'] as num).toDouble();

    final zakat = wealth >= nisab ? wealth * 0.025 : 0.0;

    return Response.ok(
      jsonEncode({'zakatAmount': zakat}),
      headers: {'content-type': 'application/json'},
    );
  } catch (e) {
    return Response.internalServerError(
      body: jsonEncode({'error': e.toString()}),
    );
  }
}
```

## Overview

Dart can build high-performance server applications using the shelf package. Server-side Dart is excellent for building RESTful APIs, WebSocket servers, and microservices.

This guide covers **Dart 3.0+ server-side development**.

## REST API

```dart
class ZakatAPI {
  Response handleRequest(Request request) {
    final path = request.url.path;
    final method = request.method;

    if (path == 'zakat' && method == 'POST') {
      return _calculateZakat(request);
    }

    return Response.notFound('Route not found');
  }

  Future<Response> _calculateZakat(Request request) async {
    try {
      final data = jsonDecode(await request.readAsString());
      final wealth = (data['wealth'] as num).toDouble();
      final nisab = (data['nisab'] as num).toDouble();

      final zakat = wealth >= nisab ? wealth * 0.025 : 0.0;

      return Response.ok(
        jsonEncode({
          'wealth': wealth,
          'nisab': nisab,
          'zakatAmount': zakat,
          'eligible': wealth >= nisab,
        }),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'error': e.toString()}),
      );
    }
  }
}
```

## Middleware

```dart
Middleware authMiddleware() {
  return (Handler handler) {
    return (Request request) async {
      final authHeader = request.headers['authorization'];

      if (authHeader == null || !_isValidToken(authHeader)) {
        return Response.forbidden('Unauthorized');
      }

      return handler(request);
    };
  };
}

bool _isValidToken(String token) {
  // Validate JWT token
  return token.startsWith('Bearer ');
}
```

## Related Documentation

- [Best Practices](./ex-soen-prla-da__best-practices.md)
- [Async Programming](./ex-soen-prla-da__async-programming.md)
- [Security](./ex-soen-prla-da__security.md)

---

**Last Updated**: 2026-01-29
**Dart Version**: 3.0+
