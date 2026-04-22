import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_client.dart';
import '../models/user.dart';

class AuthService {
  final Dio _dio = ApiClient.instance;

  Future<void> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      if (response.statusCode != 200) {
        throw Exception(response.data['message'] ?? 'Erreur de connexion');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  Future<User> verify2FA(String email, String code) async {
    try {
      final response = await _dio.post('/auth/verify-2fa', data: {
        'email': email,
        'code': code,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', token);
        
        return User.fromJson(data['user']);
      } else {
        throw Exception(response.data['message'] ?? 'Code invalide');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  // ─── FORGOT PASSWORD (step 1: sends reset code by email) ───────────────────
  Future<void> forgotPassword(String email) async {
    try {
      final response = await _dio.post('/auth/forgot-password', data: {'email': email});
      if (response.statusCode != 200) {
        throw Exception(response.data['message'] ?? 'Erreur lors de l\'envoi');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  // ─── RESET PASSWORD (step 2: email + code + newPassword) ────────────────────
  Future<void> resetPassword(String email, String code, String newPassword) async {
    try {
      final response = await _dio.post('/auth/reset-password', data: {
        'email': email,
        'code': code,
        'newPassword': newPassword,
      });
      if (response.statusCode != 200) {
        throw Exception(response.data['message'] ?? 'Erreur de réinitialisation');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  // ─── ACTIVATE ACCOUNT (nom + prenom + email) ────────────────────────────────
  Future<String> activateAccount(String nom, String prenom, String email) async {
    try {
      final response = await _dio.post('/auth/activate', data: {
        'nom': nom,
        'prenom': prenom,
        'email': email,
      });
      if (response.statusCode == 200) {
        return response.data['message'] ?? 'Compte activé avec succès.';
      }
      throw Exception(response.data['message'] ?? 'Erreur d\'activation');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey('jwt_token');
  }
}
