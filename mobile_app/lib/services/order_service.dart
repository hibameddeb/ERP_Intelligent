import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/order.dart';

class OrderService {
  final Dio _dio = ApiClient.instance;

  Future<List<Order>> getMyOrders() async {
    try {
      final response = await _dio.get('/commandes/mes-commandes');
      if (response.statusCode == 200) {
        final body = response.data;
        final List<dynamic> data =
            body is Map ? (body['data'] ?? []) : body as List<dynamic>;
        return data.map((json) => Order.fromJson(json)).toList();
      }
      throw Exception('Failed to load orders');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }
 
  Future<void> createOrder({
    required int idClient,
    required int idCommercial,
    required String trimestre,
    required List<OrderItem> items,
  }) async {
    try {
      // ignore: avoid_print
      print('🛒 createOrder → client=$idClient commercial=$idCommercial '
          'trimestre=$trimestre items=${items.length}');

      final response = await _dio.post('/commandes', data: {
        'id_client': idClient,
        'id_commercial': idCommercial,
        'trimestre': trimestre,
        'details': items.map((e) => e.toJson()).toList(),
      });

      // ignore: avoid_print
      print(' createOrder status=${response.statusCode}');

      if (response.statusCode != 201) {
        throw Exception(response.data['message'] ?? 'Failed to create order');
      }
    } on DioException catch (e) {
      // ignore: avoid_print
      print(' createOrder DioException '
          'status=${e.response?.statusCode} body=${e.response?.data}');
      throw Exception(e.response?.data?['message'] ?? 'Erreur réseau');
    }
  }
}