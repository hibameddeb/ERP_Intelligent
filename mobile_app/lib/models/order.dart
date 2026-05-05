// Safely converts dynamic values (String, int, double, null) into a double.
// PostgreSQL NUMERIC columns are returned as strings by node-postgres,
// so we have to handle that case explicitly.
double _toDouble(dynamic v) {
  if (v == null) return 0.0;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0.0;
  return 0.0;
}

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

class Order {
  final int? id;
  final String statut;
  final double totalTtc;
  final String? dateCreation;
  final String? clientNom;
  final String? clientPrenom;

  Order({
    required this.id,
    required this.statut,
    required this.totalTtc,
    this.dateCreation,
    this.clientNom,
    this.clientPrenom,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: _toInt(json['id']),
      statut: json['statut']?.toString() ?? 'en_attente',
      totalTtc: _toDouble(json['total_ttc']),
      dateCreation: json['date_creation']?.toString(),
      clientNom: json['client_nom']?.toString(),
      clientPrenom: json['client_prenom']?.toString(),
    );
  }
}

class OrderItem {
  /// id of the produit_entreprise row (NOT the utilisateur id).
  final int idProduit;
  final int quantite;
  final double prixUnitaireHtAp;

  OrderItem({
    required this.idProduit,
    required this.quantite,
    required this.prixUnitaireHtAp,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      idProduit: _toInt(json['id_produit']),
      quantite: _toInt(json['quantite']),
      prixUnitaireHtAp: _toDouble(json['prix_unitaire_ht_ap']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_produit': idProduit,
      'quantite': quantite,
      'prix_unitaire_ht_ap': prixUnitaireHtAp,
    };
  }
}