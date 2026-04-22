class Product {
  final int id;
  final String nomCommercial;        // nom_commercial
  final String? nomProduitF;         // fournisseur_nom_produit
  final String? descriptionInterne;  // description_interne
  final int quantite;                // quantite (stock)
  final double prixVenteHt;          // prix_vente_ht
  final double? tauxTva;             // taux_tva
  final double? tauxFodec;           // taux_fodec
  final double? tauxDc;              // taux_dc
  final String? fournisseurSociete;  // fournisseur_societe
  final String? mainImage;           // main_image (URL or base64)

  Product({
    required this.id,
    required this.nomCommercial,
    this.nomProduitF,
    this.descriptionInterne,
    required this.quantite,
    required this.prixVenteHt,
    this.tauxTva,
    this.tauxFodec,
    this.tauxDc,
    this.fournisseurSociete,
    this.mainImage,
  });

  // Kept for backward-compat with CartProvider
  double get prixUnitaireHt => prixVenteHt;
  String get nomProduit => nomCommercial;

  /// Prix TTC = HT * (1 + TVA/100) * (1 + Fodec/100) * (1 - DC/100)
  double get prixTtc {
    double prix = prixVenteHt;
    if (tauxTva != null) prix *= (1 + tauxTva! / 100);
    if (tauxFodec != null) prix *= (1 + tauxFodec! / 100);
    if (tauxDc != null) prix *= (1 - tauxDc! / 100);
    return prix;
  }

  bool get enStock => quantite > 0;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? 0,
      nomCommercial: json['nom_commercial'] ?? '',
      nomProduitF: json['fournisseur_nom_produit'],
      descriptionInterne: json['description_interne'],
      quantite: (json['quantite'] ?? 0) is int
          ? json['quantite'] ?? 0
          : int.tryParse(json['quantite'].toString()) ?? 0,
      prixVenteHt: (json['prix_vente_ht'] ?? 0).toDouble(),
      tauxTva: json['taux_tva'] != null
          ? double.tryParse(json['taux_tva'].toString())
          : null,
      tauxFodec: json['taux_fodec'] != null
          ? double.tryParse(json['taux_fodec'].toString())
          : null,
      tauxDc: json['taux_dc'] != null
          ? double.tryParse(json['taux_dc'].toString())
          : null,
      fournisseurSociete: json['fournisseur_societe'],
      mainImage: json['main_image'],
    );
  }
}
