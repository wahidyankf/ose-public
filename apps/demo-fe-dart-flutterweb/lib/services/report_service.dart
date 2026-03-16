import '../models/report.dart';
import 'api_client.dart';

Future<PLReport> getPLReport(
  String startDate,
  String endDate,
  String currency,
) async {
  final response = await apiClient.get<Map<String, dynamic>>(
    '/api/v1/reports/pl',
    queryParameters: {
      'startDate': startDate,
      'endDate': endDate,
      'currency': currency,
    },
  );
  return PLReport.fromJson(response.data!);
}
