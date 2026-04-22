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
      id: json['id'],
      role: json['role'] ?? '',
      prenom: json['prenom'] ?? '',
      nom: json['nom'] ?? '',
      email: json['email'] ?? '',
      numTlp: json['num_tlp']?.toString(),
      avatar: json['avatar'],
      clientId: json['client_id'],
      identifiant: json['identifiant'],
      ville: json['ville'],
      activite: json['activite'],
    );
  }

  String get fullName => '$prenom $nom';
}
