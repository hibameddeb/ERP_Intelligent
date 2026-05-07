import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../core/api_client.dart';
import '../../../core/app_colors.dart';
import '../../core/constants.dart';

class FactureDetailScreen extends StatefulWidget {
  final int factureId;
  const FactureDetailScreen({super.key, required this.factureId});

  @override
  State<FactureDetailScreen> createState() => _FactureDetailScreenState();
}

class _FactureDetailScreenState extends State<FactureDetailScreen> {
  final Dio _dio = ApiClient.instance;

  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _facture;
  List<Map<String, dynamic>> _details = [];
  bool _modified = false; // returned to the list to trigger refresh

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await _dio.get('/factures/${widget.factureId}');
      if (response.statusCode != 200) {
        throw Exception('Erreur ${response.statusCode}');
      }
      final body = response.data;
      final data = body is Map && body['data'] is Map ? body['data'] : body;
      final facture = (data['facture'] ?? data) as Map;
      final details = (data['details'] as List?) ?? const [];

      if (!mounted) return;
      setState(() {
        _facture = Map<String, dynamic>.from(facture);
        _details = details
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = e.response?.data is Map
          ? (e.response?.data['message']?.toString())
          : null;
      setState(() {
        _error = msg ?? 'Erreur réseau';
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  String _fmtDate(dynamic raw) {
    if (raw == null) return '—';
    try {
      final d = DateTime.parse(raw.toString()).toLocal();
      final dd = d.day.toString().padLeft(2, '0');
      final mm = d.month.toString().padLeft(2, '0');
      return '$dd/$mm/${d.year}';
    } catch (_) {
      return raw.toString();
    }
  }

  double _toDouble(dynamic v) =>
      double.tryParse(v?.toString() ?? '0') ?? 0.0;

  String _money(dynamic v) => '${_toDouble(v).toStringAsFixed(3)} TND';

  String _statutLabel(String s) {
    switch (s) {
      case 'non_payée':
        return 'impayée';
      default:
        return s;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'payée':
        return const Color(0xFF22C55E);
      case 'annulée':
        return const Color(0xFF6B7280);
      default:
        return const Color(0xFFEF4444);
    }
  }

  Color _statusBg(String s) {
    switch (s) {
      case 'payée':
        return const Color(0xFFDCFCE7);
      case 'annulée':
        return const Color(0xFFE5E7EB);
      default:
        return const Color(0xFFFEE2E2);
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        Navigator.of(context).pop(_modified);
        return false;
      },
      child: Scaffold(
        backgroundColor: AppColors.background(context),
        appBar: AppBar(
          title: const Text('Détail facture'),
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(_modified),
          ),
        ),
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(
                  color: AppConstants.primaryColor,
                ),
              )
            : _error != null
                ? _buildError()
                : _buildContent(),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline,
                size: 56, color: Colors.red.withOpacity(0.7)),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textPrimary(context).withOpacity(0.8),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    final f = _facture!;
    final statut = (f['statut'] ?? '').toString();
    final clientLabel = [
      (f['client_prenom'] ?? '').toString(),
      (f['client_nom'] ?? '').toString(),
    ].where((s) => s.isNotEmpty).join(' ').trim();
    final commercialLabel = [
      (f['commercial_prenom'] ?? '').toString(),
      (f['commercial_nom'] ?? '').toString(),
    ].where((s) => s.isNotEmpty).join(' ').trim();

    return RefreshIndicator(
      onRefresh: _load,
      color: AppConstants.primaryColor,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Header ───────────────────────────────────────────────
          _section(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        (f['num_facture'] ?? '—').toString(),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusBg(statut),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statutLabel(statut),
                        style: TextStyle(
                          color: _statusColor(statut),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _money(f['total_ttc']),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.primaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'TTC',
                  style: TextStyle(
                    fontSize: 12,
                    color:
                        AppColors.textPrimary(context).withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── Client ───────────────────────────────────────────────
          _section(
            title: 'Client',
            icon: Icons.person_outline,
            child: Column(
              children: [
                _row(
                  'Nom',
                  clientLabel.isNotEmpty ? clientLabel : '—',
                ),
                _row(
                  'Identifiant',
                  (f['client_identifiant'] ?? '—').toString(),
                ),
                _row(
                  'Adresse',
                  (f['client_adresse'] ?? '—').toString(),
                ),
                _row(
                  'Ville',
                  (f['client_ville'] ?? '—').toString(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── Commercial ───────────────────────────────────────────
          if (commercialLabel.isNotEmpty) ...[
            _section(
              title: 'Commercial',
              icon: Icons.badge_outlined,
              child: _row('Nom', commercialLabel),
            ),
            const SizedBox(height: 12),
          ],

          // ── Infos facture ────────────────────────────────────────
          _section(
            title: 'Informations',
            icon: Icons.info_outline,
            child: Column(
              children: [
                _row('Type', (f['type_en'] ?? '—').toString()),
                _row('Trimestre', (f['trimestre'] ?? '—').toString()),
                _row(
                  'Statut électronique',
                  (f['status_electronique'] ?? '—').toString(),
                ),
                _row('Date création', _fmtDate(f['date_creation'])),
                _row('Date validation', _fmtDate(f['date_validation'])),
                _row('Date envoi', _fmtDate(f['date_envoi'])),
                _row('Date échéance', _fmtDate(f['date_echeance'])),
                _row('Date paiement', _fmtDate(f['date_paiement'])),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── Totaux ───────────────────────────────────────────────
          _section(
            title: 'Totaux',
            icon: Icons.calculate_outlined,
            child: Column(
              children: [
                _row('Total HT', _money(f['total_ht'])),
                _row('Fodec', _money(f['fodec'])),
                _row('TVA', _money(f['tva'])),
                const Divider(height: 20),
                _row(
                  'Total TTC',
                  _money(f['total_ttc']),
                  bold: true,
                  highlight: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── Lignes ───────────────────────────────────────────────
          _section(
            title: 'Détails (${_details.length})',
            icon: Icons.list_alt_outlined,
            child: _details.isEmpty
                ? Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'Aucune ligne',
                      style: TextStyle(
                        color: AppColors.textPrimary(context)
                            .withOpacity(0.5),
                      ),
                    ),
                  )
                : Column(
                    children: List.generate(_details.length, (i) {
                      final d = _details[i];
                      return Padding(
                        padding: EdgeInsets.only(
                            bottom: i == _details.length - 1 ? 0 : 12),
                        child: _DetailLine(
                          nom: (d['nom_produit'] ?? 'Produit')
                              .toString(),
                          quantite: _toDouble(d['quantite']),
                          prixUnitaire: _toDouble(d['prix_unitaire_ht_ap']),
                          totalHt: _toDouble(d['total_ht_ligne']),
                          tauxTva: _toDouble(d['taux_tva']),
                          tauxFodec: _toDouble(d['taux_fodec']),
                        ),
                      );
                    }),
                  ),
          ),
          const SizedBox(height: 80), // Padding to clear FAB if any
        ],
      ),
    );
  }

  Widget _section({
    String? title,
    IconData? icon,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface(context),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon,
                      size: 18, color: AppConstants.primaryColor),
                  const SizedBox(width: 6),
                ],
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppConstants.primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
          ],
          child,
        ],
      ),
    );
  }

  Widget _row(String label, String value,
      {bool bold = false, bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color:
                    AppColors.textPrimary(context).withOpacity(0.6),
              ),
            ),
          ),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: bold ? 15 : 13,
                fontWeight: bold ? FontWeight.bold : FontWeight.w500,
                color: highlight
                    ? AppConstants.primaryColor
                    : AppColors.textPrimary(context),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailLine extends StatelessWidget {
  final String nom;
  final double quantite;
  final double prixUnitaire;
  final double totalHt;
  final double tauxTva;
  final double tauxFodec;

  const _DetailLine({
    required this.nom,
    required this.quantite,
    required this.prixUnitaire,
    required this.totalHt,
    required this.tauxTva,
    required this.tauxFodec,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background(context),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: AppColors.textPrimary(context).withOpacity(0.08),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            nom,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _smallInfo(
                  context,
                  'Qté',
                  quantite.toStringAsFixed(
                      quantite == quantite.roundToDouble() ? 0 : 2),
                ),
              ),
              Expanded(
                child: _smallInfo(
                  context,
                  'PU HT',
                  '${prixUnitaire.toStringAsFixed(3)} TND',
                ),
              ),
              Expanded(
                child: _smallInfo(
                  context,
                  'Total HT',
                  '${totalHt.toStringAsFixed(3)} TND',
                  highlight: true,
                ),
              ),
            ],
          ),
          if (tauxTva > 0 || tauxFodec > 0) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                if (tauxTva > 0)
                  Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppConstants.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'TVA ${tauxTva.toStringAsFixed(0)}%',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppConstants.primaryColor,
                      ),
                    ),
                  ),
                if (tauxFodec > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Fodec ${tauxFodec.toStringAsFixed(2)}%',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.orange,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _smallInfo(BuildContext context, String label, String value,
      {bool highlight = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: AppColors.textPrimary(context).withOpacity(0.5),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: highlight
                ? AppConstants.primaryColor
                : AppColors.textPrimary(context),
          ),
        ),
      ],
    );
  }
}