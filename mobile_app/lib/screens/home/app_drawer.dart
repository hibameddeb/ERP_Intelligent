// lib/screens/main/app_drawer.dart
//
// Sidebar (Drawer) qui affiche TOUTES les pages de l'app.
// Utilisé par MainLayout. Quand l'utilisateur tape un item, on appelle
// le callback `onSelect` avec la destination correspondante, et MainLayout
// se charge de switcher d'onglet ou d'ouvrir une page overlay.

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';
import '../../../core/app_colors.dart';
/// Toutes les destinations possibles depuis le drawer.
enum DrawerDestination {
  dashboard,
  clients,
  catalogue,
  commandes,
  factures,
  messages,
  profile,
  logout,
}

class AppDrawer extends StatefulWidget {
  final DrawerDestination currentDestination;
  final int unreadMessages;
  final ValueChanged<DrawerDestination> onSelect;

  const AppDrawer({
    super.key,
    required this.currentDestination,
    required this.unreadMessages,
    required this.onSelect,
  });

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  String _name = '';
  String _email = '';
  String _role = '';

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user_data');
    if (raw == null || raw.isEmpty) return;
    try {
      final m = jsonDecode(raw) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        final prenom = (m['prenom'] ?? '').toString();
        final nom = (m['nom'] ?? '').toString();
        _name = '$prenom $nom'.trim();
        if (_name.isEmpty) _name = (m['email'] ?? 'Utilisateur').toString();
        _email = (m['email'] ?? '').toString();
        _role = (m['role'] ?? '').toString();
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: AppColors.surface(context),
      child: SafeArea(
        child: Column(
          children: [
            // ── Header utilisateur ─────────────────────────────────────
            _UserHeader(name: _name, email: _email, role: _role),

            // ── Liste des items ────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _section('PRINCIPAL'),
                  _item(
                    icon: Icons.dashboard_outlined,
                    activeIcon: Icons.dashboard,
                    label: 'Dashboard',
                    dest: DrawerDestination.dashboard,
                  ),
                  _item(
                    icon: Icons.people_outline,
                    activeIcon: Icons.people,
                    label: 'Clients',
                    dest: DrawerDestination.clients,
                  ),
                  _item(
                    icon: Icons.inventory_2_outlined,
                    activeIcon: Icons.inventory_2,
                    label: 'Catalogue',
                    dest: DrawerDestination.catalogue,
                  ),
                  _item(
                    icon: Icons.shopping_cart_outlined,
                    activeIcon: Icons.shopping_cart,
                    label: 'Commandes',
                    dest: DrawerDestination.commandes,
                  ),

                  const SizedBox(height: 8),
                  _section('GESTION'),
                  _item(
                    icon: Icons.receipt_long_outlined,
                    activeIcon: Icons.receipt_long,
                    label: 'Factures',
                    dest: DrawerDestination.factures,
                  ),
                  _item(
                    icon: Icons.chat_bubble_outline,
                    activeIcon: Icons.chat_bubble,
                    label: 'Messages',
                    dest: DrawerDestination.messages,
                    badge: widget.unreadMessages,
                  ),

                  const SizedBox(height: 8),
                  _section('COMPTE'),
                  _item(
                    icon: Icons.person_outline,
                    activeIcon: Icons.person,
                    label: 'Profil',
                    dest: DrawerDestination.profile,
                  ),
                ],
              ),
            ),

            // ── Logout en bas ─────────────────────────────────────────
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text(
                'Déconnexion',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () => widget.onSelect(DrawerDestination.logout),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ─── Helpers pour les items du drawer ─────────────────────────────────
  Widget _section(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 6),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: AppColors.textPrimary(context).withOpacity(0.5),
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  Widget _item({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required DrawerDestination dest,
    int badge = 0,
  }) {
    final isActive = widget.currentDestination == dest;
    final color = isActive
        ? AppConstants.primaryColor
        : AppColors.textPrimary(context).withOpacity(0.85);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      decoration: BoxDecoration(
        color: isActive
            ? AppConstants.primaryColor.withOpacity(0.10)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        dense: true,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        leading: Icon(isActive ? activeIcon : icon, color: color, size: 22),
        title: Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            fontSize: 14,
          ),
        ),
        trailing: badge > 0
            ? Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(10),
                ),
                constraints:
                    const BoxConstraints(minWidth: 22, minHeight: 20),
                child: Text(
                  badge > 99 ? '99+' : '$badge',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              )
            : null,
        onTap: () => widget.onSelect(dest),
      ),
    );
  }
}

// ─── En-tête utilisateur en haut du drawer ──────────────────────────────
class _UserHeader extends StatelessWidget {
  final String name;
  final String email;
  final String role;

  const _UserHeader({
    required this.name,
    required this.email,
    required this.role,
  });

  @override
  Widget build(BuildContext context) {
    final initials = _computeInitials(name);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppConstants.primaryColor,
            AppConstants.primaryColor.withOpacity(0.75),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white,
            child: Text(
              initials,
              style: TextStyle(
                color: AppConstants.primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Nom
          Text(
            name.isEmpty ? 'Utilisateur' : name,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          // Email
          if (email.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              email,
              style: TextStyle(
                color: Colors.white.withOpacity(0.85),
                fontSize: 12,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],

          // Badge rôle
          if (role.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.22),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                role,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _computeInitials(String name) {
    if (name.trim().isEmpty) return '?';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) {
      return parts[0].substring(0, 1).toUpperCase();
    }
    return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }
}