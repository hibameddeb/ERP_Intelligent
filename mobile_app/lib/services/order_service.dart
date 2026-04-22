import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/order.dart';

class OrderService {
  final Dio _dio = ApiClient.instance;

  Future<List<Order>> getMyOrders() async {
    try {
      final response = await _dio.get('/commandes/mes-commandes');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => Order.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load orders');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  Future<void> createOrder(int clientId, int commercialId, List<OrderItem> items) async {
    try {
      final response = await _dio.post('/commandes', data: {
        'id_client': clientId,
        'id_commercial': commercialId,
        'details': items.map((e) => e.toJson()).toList(),
      });
      if (response.statusCode != 201) {
        throw Exception(response.data['message'] ?? 'Failed to create order');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }
}
