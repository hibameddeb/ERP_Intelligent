import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../core/api_client.dart';
import '../../../core/app_colors.dart';
import '../../core/constants.dart';
import 'facture_detail_screen.dart';

class FacturesScreen extends StatefulWidget {
  const FacturesScreen({super.key});

  @override
  State<FacturesScreen> createState() => _FacturesScreenState();
}

class _FacturesScreenState extends State<FacturesScreen> {
  final Dio _dio = ApiClient.instance;

  bool _loading = true;
  String? _error;
  List<_Facture> _factures = [];
  String _filter = 'all'; // all | impayee | payee

  @override
  void initState() {
    super.initState();
    _loadFactures();
  }

  Future<void> _loadFactures() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Le backend filtre déjà côté serveur :
      //   if (userRole === "commercial") WHERE f.id_commercial = $1
      // → un commercial ne reçoit donc QUE ses propres factures.
      final response = await _dio.get('/factures');

      if (response.statusCode != 200) {
        throw Exception(
            'Erreur ${response.statusCode} lors du chargement.');
      }

      final body = response.data;
      final List rows = body is Map && body['data'] is List
          ? body['data'] as List
          : (body is List ? body : const []);

      final factures = rows
          .map((e) => _Facture.fromJson(Map<String, dynamic>.from(e)))
          .toList();

      if (!mounted) return;
      setState(() {
        _factures = factures;
        _loading = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      final msg = e.response?.data is Map
          ? (e.response?.data['message']?.toString())
          : null;
      setState(() {
        _error = msg ?? 'Erreur réseau';
        _factures = [];
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _factures = [];
        _loading = false;
      });
    }
  }

  Future<void> _openDetail(_Facture f) async {
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => FactureDetailScreen(factureId: f.id),
      ),
    );
    // Si l'écran de détail a modifié la facture (ex. paiement), on recharge.
    if (updated == true) {
      _loadFactures();
    }
  }

  List<_Facture> get _filtered {
    if (_filter == 'all') return _factures;
    if (_filter == 'impayee') {
      return _factures.where((f) => f.isImpayee).toList();
    }
    return _factures.where((f) => f.isPayee).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              _FilterChip(
                label: 'Toutes',
                selected: _filter == 'all',
                onTap: () => setState(() => _filter = 'all'),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Impayées',
                selected: _filter == 'impayee',
                onTap: () => setState(() => _filter = 'impayee'),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Payées',
                selected: _filter == 'payee',
                onTap: () => setState(() => _filter = 'payee'),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(
                  child: CircularProgressIndicator(
                    color: AppConstants.primaryColor,
                  ),
                )
              : _error != null
                  ? _ErrorView(message: _error!, onRetry: _loadFactures)
                  : _filtered.isEmpty
                      ? _EmptyView(onRefresh: _loadFactures)
                      : RefreshIndicator(
                          onRefresh: _loadFactures,
                          color: AppConstants.primaryColor,
                          child: ListView.separated(
                            padding:
                                const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, i) {
                              final f = _filtered[i];
                              return _FactureCard(
                                facture: f,
                                onTap: () => _openDetail(f),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }
}

class _EmptyView extends StatelessWidget {
  final Future<void> Function() onRefresh;
  const _EmptyView({required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppConstants.primaryColor,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.55,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.receipt_long_outlined,
                    size: 64,
                    color:
                        AppColors.textPrimary(context).withOpacity(0.25),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Aucune facture',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary(context)
                          .withOpacity(0.7),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tirez vers le bas pour rafraîchir',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textPrimary(context)
                          .withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
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
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textPrimary(context).withOpacity(0.8),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
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
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppConstants.primaryColor
              : AppColors.surface(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? AppConstants.primaryColor
                : AppColors.textPrimary(context).withOpacity(0.15),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.textPrimary(context),
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _FactureCard extends StatelessWidget {
  final _Facture facture;
  final VoidCallback onTap;
  const _FactureCard({required this.facture, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = facture.statusColor;
    final bg = facture.statusBg;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
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
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.receipt_long, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      facture.numero,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      facture.client,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textPrimary(context)
                            .withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${facture.montant.toStringAsFixed(2)} TND',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      facture.statutLabel,
                      style: TextStyle(
                        color: color,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              Icon(
                Icons.chevron_right,
                color: AppColors.textPrimary(context).withOpacity(0.3),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Facture {
  final int id;
  final String numero;
  final String client;
  final double montant;
  final String statut;

  _Facture({
    required this.id,
    required this.numero,
    required this.client,
    required this.montant,
    required this.statut,
  });

  factory _Facture.fromJson(Map<String, dynamic> j) {
    final nom = (j['client_nom'] ?? '').toString().trim();
    final prenom = (j['client_prenom'] ?? '').toString().trim();
    final ident = (j['client_identifiant'] ?? '').toString().trim();
    final clientLabel = [prenom, nom]
        .where((s) => s.isNotEmpty)
        .join(' ')
        .trim();

    return _Facture(
      id: (j['id'] as num?)?.toInt() ?? 0,
      numero: (j['num_facture'] ?? '—').toString(),
      client: clientLabel.isNotEmpty
          ? clientLabel
          : (ident.isNotEmpty ? ident : 'Client inconnu'),
      montant: double.tryParse(j['total_ttc']?.toString() ?? '0') ?? 0.0,
      statut: (j['statut'] ?? 'non_payée').toString(),
    );
  }

  bool get isPayee => statut == 'payée';
  bool get isImpayee => statut == 'non_payée';
  bool get isAnnulee => statut == 'annulée';

  String get statutLabel {
    switch (statut) {
      case 'payée':
        return 'payée';
      case 'non_payée':
        return 'impayée';
      case 'annulée':
        return 'annulée';
      default:
        return statut;
    }
  }

  Color get statusColor {
    if (isPayee) return const Color(0xFF22C55E);
    if (isAnnulee) return const Color(0xFF6B7280);
    return const Color(0xFFEF4444);
  }

  Color get statusBg {
    if (isPayee) return const Color(0xFFDCFCE7);
    if (isAnnulee) return const Color(0xFFE5E7EB);
    return const Color(0xFFFEE2E2);
  }
}