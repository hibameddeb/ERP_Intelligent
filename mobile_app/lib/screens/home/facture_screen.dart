// lib/screens/main/factures_screen.dart
//
// Écran "Factures" — placeholder fonctionnel.
// La liste affiche un état vide pour l'instant. Une fois ton endpoint backend
// `/api/factures` prêt, branche-le dans `_loadFactures()`.
import '../../../core/app_colors.dart';
import 'package:flutter/material.dart';
import '../../core/constants.dart';

class FacturesScreen extends StatefulWidget {
  const FacturesScreen({super.key});

  @override
  State<FacturesScreen> createState() => _FacturesScreenState();
}

class _FacturesScreenState extends State<FacturesScreen> {
  bool _loading = true;
  List<_Facture> _factures = [];
  String _filter = 'all'; // all | impayee | payee

  @override
  void initState() {
    super.initState();
    _loadFactures();
  }

  Future<void> _loadFactures() async {
    setState(() => _loading = true);

    // ─── TODO : remplace par un vrai appel API ─────────────────────────
    // Exemple :
    //   final list = await FactureService().list();

    await Future.delayed(const Duration(milliseconds: 300));

    if (!mounted) return;
    setState(() {
      _factures = []; // ← liste vide pour le placeholder
      _loading = false;
    });
  }

  List<_Facture> get _filtered {
    if (_filter == 'all') return _factures;
    if (_filter == 'impayee') {
      return _factures.where((f) => f.statut == 'impayée').toList();
    }
    return _factures.where((f) => f.statut == 'payée').toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Filtres ──────────────────────────────────────────────────
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

        // ── Liste ────────────────────────────────────────────────────
        Expanded(
          child: _loading
              ? const Center(
                  child: CircularProgressIndicator(
                      color: AppConstants.primaryColor),
                )
              : _filtered.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _loadFactures,
                      color: AppConstants.primaryColor,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(
                            height:
                                MediaQuery.of(context).size.height * 0.55,
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.receipt_long_outlined,
                                    size: 64,
                                    color: AppConstants.textPrimary
                                        .withOpacity(0.25),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Aucune facture',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: AppConstants.textPrimary
                                          .withOpacity(0.7),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Tirez vers le bas pour rafraîchir',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppConstants.textPrimary
                                          .withOpacity(0.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadFactures,
                      color: AppConstants.primaryColor,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                        itemCount: _filtered.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 10),
                        itemBuilder: (context, i) =>
                            _FactureCard(facture: _filtered[i]),
                      ),
                    ),
        ),
      ],
    );
  }
}

// ─── Chip de filtre ────────────────────────────────────────────────────────
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
              : AppConstants.surfaceColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? AppConstants.primaryColor
                : AppConstants.textPrimary.withOpacity(0.15),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppConstants.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

// ─── Carte facture ─────────────────────────────────────────────────────────
class _FactureCard extends StatelessWidget {
  final _Facture facture;
  const _FactureCard({required this.facture});

  @override
  Widget build(BuildContext context) {
    final isImpayee = facture.statut == 'impayée';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppConstants.surfaceColor,
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
              color: isImpayee
                  ? const Color(0xFFFEE2E2)
                  : const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.receipt_long,
              color: isImpayee
                  ? const Color(0xFFEF4444)
                  : const Color(0xFF22C55E),
            ),
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
                    color: AppConstants.textPrimary.withOpacity(0.6),
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
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isImpayee
                      ? const Color(0xFFFEE2E2)
                      : const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  facture.statut,
                  style: TextStyle(
                    color: isImpayee
                        ? const Color(0xFFEF4444)
                        : const Color(0xFF22C55E),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Facture {
  final String numero;
  final String client;
  final double montant;
  final String statut; // 'payée' | 'impayée'

  _Facture({
    required this.numero,
    required this.client,
    required this.montant,
    required this.statut,
  });
}