import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/user.dart';

class UserService {
  final Dio _dio = ApiClient.instance;

  Future<List<User>> getMyClients() async {
    try {
      final response = await _dio.get('/users');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => User.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load clients');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }
}
