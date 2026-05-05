// lib/models/message.dart
//
// Modèle pour les messages chat client ↔ commercial.
// Correspond aux colonnes de la table `message_chat` + champs enrichis
// (nom, prenom, avatar) renvoyés par messageController.js côté backend.

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

String _toStr(dynamic v) {
  if (v == null) return '';
  return v.toString();
}

String? _toNullableStr(dynamic v) {
  if (v == null) return null;
  final s = v.toString();
  return s.isEmpty ? null : s;
}

bool _toBool(dynamic v) {
  if (v == null) return false;
  if (v is bool) return v;
  if (v is num) return v != 0;
  if (v is String) {
    final s = v.toLowerCase();
    return s == 'true' || s == 't' || s == '1';
  }
  return false;
}

DateTime _toDate(dynamic v) {
  if (v == null) return DateTime.now();
  if (v is DateTime) return v;
  return DateTime.tryParse(v.toString())?.toLocal() ?? DateTime.now();
}

class Message {
  final int id;
  final int idExpediteur;
  final int idDestinataire;
  final String contenu;
  final bool lu;
  final DateTime dateEnvoi;

  // Champs enrichis (nom de l'expéditeur)
  final String? nom;
  final String? prenom;
  final String? avatar;

  Message({
    required this.id,
    required this.idExpediteur,
    required this.idDestinataire,
    required this.contenu,
    required this.lu,
    required this.dateEnvoi,
    this.nom,
    this.prenom,
    this.avatar,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: _toInt(json['id']),
      idExpediteur: _toInt(json['id_expediteur']),
      idDestinataire: _toInt(json['id_destinataire']),
      contenu: _toStr(json['contenu']),
      lu: _toBool(json['lu']),
      dateEnvoi: _toDate(json['date_envoi']),
      nom: _toNullableStr(json['nom']),
      prenom: _toNullableStr(json['prenom']),
      avatar: _toNullableStr(json['avatar']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'id_expediteur': idExpediteur,
        'id_destinataire': idDestinataire,
        'contenu': contenu,
        'lu': lu,
        'date_envoi': dateEnvoi.toIso8601String(),
        'nom': nom,
        'prenom': prenom,
        'avatar': avatar,
      };

  bool isMine(int myId) => idExpediteur == myId;
}

/// Représente un contact (avec dernier message + non-lus) dans la liste de chat.
/// Renvoyé par GET /messages/contacts.
class ChatContact {
  final int id;
  final String nom;
  final String prenom;
  final String email;
  final String? avatar;
  final String role;

  final String? lastMessage;
  final DateTime? lastMessageDate;
  final int unreadCount;

  ChatContact({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.email,
    this.avatar,
    required this.role,
    this.lastMessage,
    this.lastMessageDate,
    this.unreadCount = 0,
  });

  factory ChatContact.fromJson(Map<String, dynamic> json) {
    return ChatContact(
      id: _toInt(json['id']),
      nom: _toStr(json['nom']),
      prenom: _toStr(json['prenom']),
      email: _toStr(json['email']),
      avatar: _toNullableStr(json['avatar']),
      role: _toStr(json['role']),
      lastMessage: _toNullableStr(json['last_message']),
      lastMessageDate: json['last_message_date'] == null
          ? null
          : _toDate(json['last_message_date']),
      unreadCount: _toInt(json['unread_count']),
    );
  }

  String get fullName {
    final f = '$prenom $nom'.trim();
    return f.isEmpty ? email : f;
  }
}