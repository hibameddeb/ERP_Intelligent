import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/product.dart';

class ProductService {
  final Dio _dio = ApiClient.instance;

  Future<List<Product>> getProducts() async {
    try {
      final response = await _dio.get('/produits-entreprise');
      if (response.statusCode == 200) {
        final body = response.data;
        // API wraps results in { success, data: [] }
        final List<dynamic> data =
            body is Map ? (body['data'] ?? []) : body;
        return data.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Erreur de chargement des produits');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  /// GET /produits/:id — returns { success: true, data: {} }
  Future<Product> getProductById(int id) async {
    try {
      final response = await _dio.get('/produits-entreprise/$id');
      if (response.statusCode == 200) {
        return Product.fromJson(response.data['data']);
      }
      throw Exception('Produit introuvable');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }
}
