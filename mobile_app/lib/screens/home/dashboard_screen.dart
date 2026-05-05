// lib/screens/main/dashboard_screen.dart
//
// Dashboard avec des KPI cards (chiffre d'affaires, clients, commandes, factures).
// Les données sont chargées en parallèle et affichées dans une grille 2x2.
//
// ⚠️ Pour l'instant les valeurs sont des PLACEHOLDERS. Remplace les
// `_loadStats()` par des vrais appels à ton backend (voir TODO en bas du fichier).

import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../../core/app_colors.dart';
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  _Stats? _stats;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // ─── TODO : remplace par tes vrais appels API ────────────────────
      // Exemple :
      //   final ca       = await StatsService().getCA();
      //   final clients  = await UserService().getMyClients();
      //   final commandes = await OrderService().getOrders();
      //   final factures = await FactureService().list();

      // Simulation pour le placeholder
      await Future.delayed(const Duration(milliseconds: 400));
      final stats = _Stats(
        chiffreAffaires: 15420.50,
        nombreClients: 24,
        commandesEnAttente: 7,
        facturesImpayees: 3,
        commandesTotal: 156,
        facturesTotal: 142,
      );

      if (!mounted) return;
      setState(() {
        _stats = stats;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppConstants.primaryColor),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 56, color: Colors.redAccent),
              const SizedBox(height: 12),
              Text('Erreur: $_error', textAlign: TextAlign.center),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _loadStats,
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    final s = _stats!;
    return RefreshIndicator(
      onRefresh: _loadStats,
      color: AppConstants.primaryColor,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Salutation / titre ────────────────────────────────────
            const Text(
              'Vue d\'ensemble',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Statistiques de votre activité',
              style: TextStyle(
                fontSize: 13,
                color: AppConstants.textPrimary.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 20),

            // ── Grille 2x2 de KPIs ───────────────────────────────────
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.15,
              children: [
                _StatCard(
                  icon: Icons.attach_money,
                  iconColor: const Color(0xFF22C55E),
                  bgColor: const Color(0xFFDCFCE7),
                  label: 'Chiffre d\'affaires',
                  value: '${s.chiffreAffaires.toStringAsFixed(2)} TND',
                ),
                _StatCard(
                  icon: Icons.people,
                  iconColor: const Color(0xFF3B82F6),
                  bgColor: const Color(0xFFDBEAFE),
                  label: 'Clients',
                  value: '${s.nombreClients}',
                ),
                _StatCard(
                  icon: Icons.shopping_cart,
                  iconColor: const Color(0xFFF59E0B),
                  bgColor: const Color(0xFFFEF3C7),
                  label: 'Commandes en attente',
                  value: '${s.commandesEnAttente}',
                  subtitle: '/ ${s.commandesTotal} total',
                ),
                _StatCard(
                  icon: Icons.receipt_long,
                  iconColor: const Color(0xFFEF4444),
                  bgColor: const Color(0xFFFEE2E2),
                  label: 'Factures impayées',
                  value: '${s.facturesImpayees}',
                  subtitle: '/ ${s.facturesTotal} total',
                ),
              ],
            ),

            const SizedBox(height: 24),

            // ── Section "Activité récente" (placeholder) ─────────────
            const Text(
              'Activité récente',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppConstants.surfaceColor,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.timeline,
                    size: 40,
                    color: AppConstants.textPrimary.withOpacity(0.3),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Aucune activité à afficher',
                    style: TextStyle(
                      color: AppConstants.textPrimary.withOpacity(0.6),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Carte KPI ─────────────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final String value;
  final String? subtitle;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.value,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppConstants.surfaceColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: AppConstants.textPrimary.withOpacity(0.65),
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: TextStyle(
                    fontSize: 10,
                    color: AppConstants.textPrimary.withOpacity(0.45),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Modèle de stats ───────────────────────────────────────────────────────
class _Stats {
  final double chiffreAffaires;
  final int nombreClients;
  final int commandesEnAttente;
  final int facturesImpayees;
  final int commandesTotal;
  final int facturesTotal;

  _Stats({
    required this.chiffreAffaires,
    required this.nombreClients,
    required this.commandesEnAttente,
    required this.facturesImpayees,
    required this.commandesTotal,
    required this.facturesTotal,
  });
}