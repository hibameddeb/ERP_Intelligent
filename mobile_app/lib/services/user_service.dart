import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/user.dart';

class UserService {
  final Dio _dio = ApiClient.instance;

  /// Helper : extrait la liste depuis {success, data: [...]} ou une List brute.
  List<dynamic> _extractList(dynamic body) {
    if (body is List) return body;
    if (body is Map && body['data'] is List) return body['data'] as List;
    return const [];
  }

  /// GET /users — liste tous les utilisateurs.
  Future<List<User>> getMyClients() async {
    try {
      final response = await _dio.get('/users');
      if (response.statusCode == 200) {
        final list = _extractList(response.data);
        return list
            .map((j) => User.fromJson(Map<String, dynamic>.from(j)))
            .toList();
      }
      throw Exception('Failed to load users');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  /// Liste uniquement les utilisateurs ayant le rôle CLIENT.
  /// Utilisé par le panier pour choisir pour qui passer la commande.
  Future<List<User>> getClients() async {
    final all = await getMyClients();
    return all
        .where((u) => (u.role ?? '').toUpperCase() == 'CLIENT')
        .toList();
  }
}