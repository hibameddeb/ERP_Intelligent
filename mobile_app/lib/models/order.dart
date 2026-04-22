class Order {
  final int id;
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
      id: json['id'],
      statut: json['statut'] ?? 'en_attente',
      totalTtc: (json['total_ttc'] ?? 0).toDouble(),
      dateCreation: json['date_creation'],
      clientNom: json['client_nom'],
      clientPrenom: json['client_prenom'],
    );
  }
}

class OrderItem {
  final int idProduit;
  final int quantite;
  final double prixUnitaireHtAp;

  OrderItem({
    required this.idProduit,
    required this.quantite,
    required this.prixUnitaireHtAp,
  });

  Map<String, dynamic> toJson() {
    return {
      'id_produit': idProduit,
      'quantite': quantite,
      'prix_unitaire_ht_ap': prixUnitaireHtAp,
    };
  }
}
