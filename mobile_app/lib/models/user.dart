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

class User {
  final int id;
  final String role;
  final String prenom;
  final String nom;
  final String email;
  final String? numTlp;
  final String? avatar;

  // Client specific fields
  final int? clientId;
  final String? identifiant;
  final String? ville;
  final String? activite;

  User({
    required this.id,
    required this.role,
    required this.prenom,
    required this.nom,
    required this.email,
    this.numTlp,
    this.avatar,
    this.clientId,
    this.identifiant,
    this.ville,
    this.activite,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: _toInt(json['id']),
      role: _toStr(json['role']),
      prenom: _toStr(json['prenom']),
      nom: _toStr(json['nom']),
      email: _toStr(json['email']),
      numTlp: _toNullableStr(json['num_tlp']),
      avatar: _toNullableStr(json['avatar']),
      clientId: json['client_id'] == null ? null : _toInt(json['client_id']),
      identifiant: _toNullableStr(json['identifiant']),
      ville: _toNullableStr(json['ville']),
      activite: _toNullableStr(json['activite']),
    );
  }

  String get fullName {
    final full = '$prenom $nom'.trim();
    return full.isEmpty ? email : full;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'prenom': prenom,
      'nom': nom,
      'email': email,
      'num_tlp': numTlp,
      'avatar': avatar,
      'client_id': clientId,
      'identifiant': identifiant,
      'ville': ville,
      'activite': activite,
    };
  }
}