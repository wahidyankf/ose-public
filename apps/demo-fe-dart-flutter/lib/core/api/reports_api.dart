/// Financial reports API functions.
///
/// Wraps the `/api/v1/reports/*` endpoints.
library;

import 'package:demo_fe_dart_flutter/core/api/api_client.dart';
import 'package:demo_fe_dart_flutter/core/models/models.dart';

/// Returns a profit and loss report for the given [startDate]–[endDate] range
/// denominated in [currency].
///
/// Dates must be ISO-8601 strings (e.g. `'2025-01-01'`).
Future<PLReport> getPLReport({
  required String startDate,
  required String endDate,
  required String currency,
}) async {
  final response = await dio.get<Map<String, dynamic>>(
    '/api/v1/reports/pl',
    queryParameters: {
      'start_date': startDate,
      'end_date': endDate,
      'currency': currency,
    },
  );
  return PLReport.fromJson(response.data!);
}
