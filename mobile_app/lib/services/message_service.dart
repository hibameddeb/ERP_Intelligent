// lib/services/message_service.dart
//
// Utilise Dio + ApiClient.instance comme les autres services de l'app
// (UserService, OrderService, ProductService). Le token JWT est ajouté
// automatiquement par l'intercepteur global de ApiClient.

import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/message.dart';

class MessageService {
  final Dio _dio = ApiClient.instance;

  /// Helper : extrait la liste depuis une réponse {success, data: [...]}
  /// ou directement une List si le backend renvoie une liste brute.
  List _extractList(dynamic body) {
    if (body is List) return body;
    if (body is Map && body['data'] is List) return body['data'] as List;
    return const [];
  }

  // ─── GET /messages/contacts ─────────────────────────────────────────────
  Future<List<ChatContact>> getContacts() async {
    try {
      final response = await _dio.get('/messages/contacts');
      if (response.statusCode == 200) {
        final list = _extractList(response.data);
        return list
            .map((e) => ChatContact.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      throw Exception('Erreur chargement contacts');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  // ─── GET /messages/conversation/:userId ─────────────────────────────────
  Future<List<Message>> getConversation(int contactId) async {
    try {
      final response = await _dio.get('/messages/conversation/$contactId');
      if (response.statusCode == 200) {
        final list = _extractList(response.data);
        return list
            .map((e) => Message.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      throw Exception('Erreur chargement conversation');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  // ─── POST /messages ─────────────────────────────────────────────────────
  Future<Message> sendMessage({
    required int destinataireId,
    required String contenu,
  }) async {
    try {
      final response = await _dio.post('/messages', data: {
        'id_destinataire': destinataireId,
        'contenu': contenu,
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = response.data;
        final data = (body is Map && body['data'] != null) ? body['data'] : body;
        return Message.fromJson(Map<String, dynamic>.from(data));
      }
      throw Exception('Erreur envoi message');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  // ─── PUT /messages/:userId/read ─────────────────────────────────────────
  Future<void> markAsRead(int contactId) async {
    try {
      await _dio.put('/messages/$contactId/read');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur réseau');
    }
  }

  // ─── GET /messages/unread/count ─────────────────────────────────────────
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/messages/unread/count');
      if (response.statusCode == 200) {
        final body = response.data;
        if (body is Map && body['count'] != null) {
          return int.tryParse(body['count'].toString()) ?? 0;
        }
      }
      return 0;
    } on DioException catch (_) {
      return 0;
    }
  }
}