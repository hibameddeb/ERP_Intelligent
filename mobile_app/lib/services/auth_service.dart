import 'dart:convert';
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
        await prefs.setString('user_data', jsonEncode(data['user']));
        
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

  Future<User?> getUserFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final userDataStr = prefs.getString('user_data');
    if (userDataStr != null) {
      try {
        final userData = jsonDecode(userDataStr);
        return User.fromJson(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ─── UPDATE PROFILE ─────────────────────────────────────────────────────────
  Future<User> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/auth/profile', data: data);
      if (response.statusCode == 200) {
        final updatedData = response.data['user'];
        // We only get a partial user object back, so we should merge it with the current one
        final prefs = await SharedPreferences.getInstance();
        final userDataStr = prefs.getString('user_data');
        if (userDataStr != null) {
          final Map<String, dynamic> currentUserData = jsonDecode(userDataStr);
          currentUserData.addAll(Map<String, dynamic>.from(updatedData));
          await prefs.setString('user_data', jsonEncode(currentUserData));
          return User.fromJson(currentUserData);
        }
        throw Exception('Données utilisateur introuvables.');
      } else {
        throw Exception(response.data['error'] ?? 'Erreur lors de la mise à jour');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Erreur réseau');
    }
  }

  // ─── CHANGE PASSWORD ────────────────────────────────────────────────────────
  Future<void> changePassword(String currentPassword, String newPassword) async {
    try {
      final response = await _dio.put('/auth/password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
      if (response.statusCode != 200) {
        throw Exception(response.data['error'] ?? 'Erreur lors du changement de mot de passe');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Erreur réseau');
    }
  }

  // ─── UPLOAD AVATAR ──────────────────────────────────────────────────────────
  Future<String> uploadAvatar(String imagePath) async {
    try {
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(imagePath, filename: 'avatar.jpg'),
      });
      
      final response = await _dio.post('/auth/avatar', data: formData);
      if (response.statusCode == 200) {
        final avatarBase64 = response.data['avatar'];
        
        // Update local prefs
        final prefs = await SharedPreferences.getInstance();
        final userDataStr = prefs.getString('user_data');
        if (userDataStr != null) {
          final Map<String, dynamic> currentUserData = jsonDecode(userDataStr);
          currentUserData['avatar'] = avatarBase64;
          await prefs.setString('user_data', jsonEncode(currentUserData));
        }
        
        return avatarBase64;
      } else {
        throw Exception(response.data['error'] ?? 'Erreur lors de l\'upload');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Erreur réseau');
    }
  }
}
