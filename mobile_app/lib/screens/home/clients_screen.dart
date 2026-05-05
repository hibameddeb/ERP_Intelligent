// lib/screens/main/clients_screen.dart
//
// Redesign moderne inspiré du mockup : header épuré, rangée "stories"
// horizontale avec indicateurs en ligne, cartes raffinées avec accents
// colorés. Toutes les fonctionnalités d'origine sont conservées (recherche,
// pull-to-refresh, bottom sheet de détail, actions appeler / commander).
import '../../../core/app_colors.dart';
import 'package:flutter/material.dart';
import '../../../services/user_service.dart';
import '../../../models/user.dart';
import '../../../core/constants.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  final UserService _userService = UserService();
  late Future<List<User>> _clientsFuture;
  String _search = '';
  bool _showSearch = false;
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _clientsFuture = _userService.getMyClients();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() {
      _clientsFuture = _userService.getMyClients();
    });
    await _clientsFuture;
  }

  void _showClientDetail(User client) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ClientDetailSheet(client: client),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F3FF), // soft lavender wash
      body: SafeArea(
        child: FutureBuilder<List<User>>(
          future: _clientsFuture,
          builder: (context, snapshot) {
            // ── Loading ──────────────────────────────────────────────────
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(
                    color: AppConstants.primaryColor),
              );
            }

            // ── Error ────────────────────────────────────────────────────
            if (snapshot.hasError) {
              return _ErrorView(
                error: snapshot.error.toString(),
                onRetry: _refresh,
              );
            }

            final all = snapshot.data ?? const <User>[];
            final filtered = _search.isEmpty
                ? all
                : all.where((c) {
                    final q = _search.toLowerCase();
                    return c.fullName.toLowerCase().contains(q) ||
                        c.email.toLowerCase().contains(q) ||
                        (c.ville?.toLowerCase().contains(q) ?? false);
                  }).toList();

            return RefreshIndicator(
              onRefresh: _refresh,
              color: AppConstants.primaryColor,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  // ── Top bar ──────────────────────────────────────────
                  SliverToBoxAdapter(child: _buildTopBar()),

                  // ── Title + count ────────────────────────────────────
                  SliverToBoxAdapter(child: _buildTitle(all.length)),

                  // ── Stories row ──────────────────────────────────────
                  if (all.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _StoriesRow(
                        clients: all.take(8).toList(),
                        onTap: _showClientDetail,
                      ),
                    ),

                  // ── Section header ───────────────────────────────────
                  SliverToBoxAdapter(child: _buildSectionHeader()),

                  // ── List or empty ────────────────────────────────────
                  if (all.isEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyView(),
                    )
                  else if (filtered.isEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: Text(
                            'Aucun résultat pour cette recherche',
                            style: TextStyle(
                                color: AppConstants.textSecondary,
                                fontSize: 15),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, i) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _ClientCard(
                              client: filtered[i],
                              isFirst: i == 0,
                              onTap: () => _showClientDetail(filtered[i]),
                            ),
                          ),
                          childCount: filtered.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  // ─── Top Bar ─────────────────────────────────────────────────────────
  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              setState(() {
                _showSearch = !_showSearch;
                if (!_showSearch) {
                  _searchCtrl.clear();
                  _search = '';
                }
              });
            },
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.search_rounded,
                color: AppConstants.primaryColor,
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Text(
              'Business Manager',
              style: TextStyle(
                color: AppConstants.primaryColor,
                fontSize: 19,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.3,
              ),
            ),
          ),
          // Notification bell with red dot
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.notifications_outlined,
                  color: AppConstants.textPrimary,
                  size: 22,
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF3B30),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Title + search field ────────────────────────────────────────────
  Widget _buildTitle(int total) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                'Mes Clients',
                style: TextStyle(
                  color: Color(0xFF1A1A2E),
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.8,
                  height: 1,
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppConstants.primaryColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$total',
                    style: const TextStyle(
                      color: AppConstants.primaryColor,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Animated search field
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            child: _showSearch
                ? Padding(
                    padding: const EdgeInsets.only(top: 14),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _searchCtrl,
                        autofocus: true,
                        decoration: InputDecoration(
                          hintText: 'Nom, email ou ville…',
                          hintStyle: TextStyle(
                              color: Colors.grey.shade400, fontSize: 14),
                          prefixIcon: const Icon(Icons.search_rounded,
                              color: AppConstants.primaryColor, size: 22),
                          suffixIcon: _search.isEmpty
                              ? null
                              : IconButton(
                                  icon: const Icon(Icons.close_rounded,
                                      size: 20),
                                  onPressed: () {
                                    _searchCtrl.clear();
                                    setState(() => _search = '');
                                  },
                                ),
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 14),
                          border: InputBorder.none,
                        ),
                        onChanged: (v) => setState(() => _search = v),
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  // ─── Section header ──────────────────────────────────────────────────
  Widget _buildSectionHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Tous les clients',
            style: TextStyle(
              color: Color(0xFF1A1A2E),
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.2,
            ),
          ),
          Text(
            'Trier',
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Stories Row (recent / favorite clients) ────────────────────────────
class _StoriesRow extends StatelessWidget {
  final List<User> clients;
  final void Function(User) onTap;

  const _StoriesRow({required this.clients, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 96,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: clients.length,
        itemBuilder: (_, i) {
          final c = clients[i];
          final isOnline = i % 3 == 0; // mock — replace with real status
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: GestureDetector(
              onTap: () => onTap(c),
              child: Column(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      // Outer ring when "active" (first one)
                      Container(
                        padding: EdgeInsets.all(i == 0 ? 2.5 : 0),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: i == 0
                              ? const LinearGradient(
                                  colors: [
                                    AppConstants.primaryColor,
                                    Color(0xFF8B5CF6),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : null,
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF5F3FF),
                            shape: BoxShape.circle,
                          ),
                          child: CircleAvatar(
                            radius: 28,
                            backgroundColor:
                                AppConstants.primaryColor.withOpacity(0.12),
                            child: Text(
                              c.prenom.isNotEmpty
                                  ? c.prenom[0].toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                color: AppConstants.primaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                              ),
                            ),
                          ),
                        ),
                      ),
                      if (isOnline)
                        Positioned(
                          right: 2,
                          bottom: 2,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: const Color(0xFF34D399),
                              shape: BoxShape.circle,
                              border:
                                  Border.all(color: Colors.white, width: 2),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: 64,
                    child: Text(
                      c.prenom.isEmpty ? c.nom : c.prenom,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1A2E),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─── Client Card ────────────────────────────────────────────────────────
class _ClientCard extends StatelessWidget {
  final User client;
  final bool isFirst;
  final VoidCallback onTap;

  const _ClientCard({
    required this.client,
    required this.isFirst,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
            // Left accent bar for the "highlighted" card
            border: isFirst
                ? const Border(
                    left: BorderSide(
                        color: AppConstants.primaryColor, width: 4),
                  )
                : null,
          ),
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppConstants.primaryColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Text(
                  _initials(client),
                  style: const TextStyle(
                    color: AppConstants.primaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 17,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              // Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            client.fullName,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1A1A2E),
                              letterSpacing: -0.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (client.ville != null && client.ville!.isNotEmpty)
                          _CityChip(city: client.ville!),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      client.activite?.isNotEmpty == true
                          ? client.activite!
                          : client.email,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _initials(User c) {
    final p = c.prenom.isNotEmpty ? c.prenom[0] : '';
    final n = c.nom.isNotEmpty ? c.nom[0] : '';
    final out = (p + n).toUpperCase();
    return out.isEmpty ? '?' : out;
  }
}

class _CityChip extends StatelessWidget {
  final String city;
  const _CityChip({required this.city});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F3FF),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.location_on_rounded,
              size: 11, color: AppConstants.primaryColor),
          const SizedBox(width: 3),
          Text(
            city,
            style: const TextStyle(
              fontSize: 11,
              color: AppConstants.primaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty / Error views ─────────────────────────────────────────────────
class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: AppConstants.primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.people_alt_rounded,
                size: 44,
                color: AppConstants.primaryColor,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Aucun client assigné',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A2E),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Tes clients apparaîtront ici une fois\nqu\'ils te seront assignés.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFFFE5E5),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.wifi_off_rounded,
                  size: 38, color: Color(0xFFFF3B30)),
            ),
            const SizedBox(height: 20),
            const Text(
              'Erreur de chargement',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A2E),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 13, color: Colors.grey.shade600, height: 1.4),
            ),
            const SizedBox(height: 18),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Réessayer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                    horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Client Detail Sheet (preserved from original) ───────────────────────
class _ClientDetailSheet extends StatelessWidget {
  final User client;
  const _ClientDetailSheet({required this.client});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      expand: false,
      builder: (_, sc) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          controller: sc,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor:
                          AppConstants.primaryColor.withOpacity(0.12),
                      child: Text(
                        client.prenom.isNotEmpty
                            ? client.prenom[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                            color: AppConstants.primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 32),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      client.fullName,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppConstants.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        client.role.toUpperCase(),
                        style: const TextStyle(
                            color: AppConstants.primaryColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              const _SectionTitle('Contact'),
              const SizedBox(height: 8),
              _InfoTile(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: client.email),
              if (client.numTlp != null && client.numTlp!.isNotEmpty)
                _InfoTile(
                    icon: Icons.phone_outlined,
                    label: 'Téléphone',
                    value: client.numTlp!),
              if (_hasCompanyInfo()) ...[
                const SizedBox(height: 20),
                const _SectionTitle('Informations'),
                const SizedBox(height: 8),
                if (client.identifiant != null &&
                    client.identifiant!.isNotEmpty)
                  _InfoTile(
                      icon: Icons.badge_outlined,
                      label: 'Identifiant',
                      value: client.identifiant!),
                if (client.activite != null && client.activite!.isNotEmpty)
                  _InfoTile(
                      icon: Icons.work_outline,
                      label: 'Activité',
                      value: client.activite!),
                if (client.ville != null && client.ville!.isNotEmpty)
                  _InfoTile(
                      icon: Icons.location_on_outlined,
                      label: 'Ville',
                      value: client.ville!),
              ],
              const SizedBox(height: 28),
              Row(
                children: [
                  if (client.numTlp != null && client.numTlp!.isNotEmpty)
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Appeler ${client.numTlp}')),
                          );
                        },
                        icon: const Icon(Icons.phone_rounded),
                        label: const Text('Appeler'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          foregroundColor: AppConstants.primaryColor,
                          side: const BorderSide(
                              color: AppConstants.primaryColor),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  if (client.numTlp != null && client.numTlp!.isNotEmpty)
                    const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                              content: Text(
                                  'Nouvelle commande pour ${client.fullName}')),
                        );
                      },
                      icon: const Icon(Icons.add_shopping_cart_rounded),
                      label: const Text('Commander'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppConstants.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _hasCompanyInfo() {
    return (client.identifiant?.isNotEmpty ?? false) ||
        (client.activite?.isNotEmpty ?? false) ||
        (client.ville?.isNotEmpty ?? false);
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.bold,
        color: AppConstants.textSecondary,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppConstants.primaryColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 12,
                        color: AppConstants.textSecondary)),
                const SizedBox(height: 2),
                Text(value,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppConstants.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}