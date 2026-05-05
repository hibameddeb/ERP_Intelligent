
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';
import '../../services/message_service.dart';
import '../../services/socket_service.dart';
import 'app_drawer.dart';
import 'dashboard_screen.dart';
import 'clients_screen.dart';
import 'catalogue_screen.dart';
import 'orders_screen.dart';
import 'messages_screen.dart';
import 'facture_screen.dart';
import 'profile_screen.dart';
import '../auth/login_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => MainLayoutState();
}

class MainLayoutState extends State<MainLayout> {

  int _currentIndex = 0;
  Widget? _drawerOverlayPage;
  String _drawerOverlayTitle = '';
  int _unreadCount = 0;
  Timer? _pollTimer;
  void Function()? _unsubMessageNew;

  final MessageService _messageService = MessageService();


  final List<_BottomTab> _bottomTabs = const [
    _BottomTab(
      label: 'Dashboard',
      icon: Icons.dashboard_outlined,
      activeIcon: Icons.dashboard,
      page: DashboardScreen(),
    ),
    _BottomTab(
      label: 'Clients',
      icon: Icons.people_outline,
      activeIcon: Icons.people,
      page: ClientsScreen(),
    ),
    _BottomTab(
      label: 'Catalogue',
      icon: Icons.inventory_2_outlined,
      activeIcon: Icons.inventory_2,
      page: CatalogueScreen(),
    ),
    _BottomTab(
      label: 'Commandes',
      icon: Icons.shopping_cart_outlined,
      activeIcon: Icons.shopping_cart,
      page: OrdersScreen(),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _initSocketAndUnread();
  }

  Future<void> _initSocketAndUnread() async {
    await SocketService().connect();
    _refreshUnread();

    _unsubMessageNew = SocketService().onMessageNew((_) {
      _refreshUnread();
    });

    _pollTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _refreshUnread(),
    );
  }

  Future<void> _refreshUnread() async {
    try {
      final c = await _messageService.getUnreadCount();
      if (!mounted) return;
      setState(() => _unreadCount = c);
    } catch (_) {
      // silencieux
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _unsubMessageNew?.call();
    super.dispose();
  }

  // ─── Navigation depuis le drawer ──────────────────────────────────────
  /// Appelé par l'AppDrawer quand on tape un item.
  void navigateFromDrawer(DrawerDestination dest) {
    Navigator.pop(context); // ferme le drawer

    switch (dest) {
      // Items présents dans le bottom bar → on switche d'onglet
      case DrawerDestination.dashboard:
        setState(() {
          _currentIndex = 0;
          _drawerOverlayPage = null;
        });
        break;
      case DrawerDestination.clients:
        setState(() {
          _currentIndex = 1;
          _drawerOverlayPage = null;
        });
        break;
      case DrawerDestination.catalogue:
        setState(() {
          _currentIndex = 2;
          _drawerOverlayPage = null;
        });
        break;
      case DrawerDestination.commandes:
        setState(() {
          _currentIndex = 3;
          _drawerOverlayPage = null;
        });
        break;

      // Items uniquement dans le drawer → on superpose la page
      case DrawerDestination.factures:
        setState(() {
          _drawerOverlayPage = const FacturesScreen();
          _drawerOverlayTitle = 'Factures';
        });
        break;
      case DrawerDestination.messages:
        setState(() {
          _drawerOverlayPage = const MessagesScreen();
          _drawerOverlayTitle = 'Messages';
        });
        _refreshUnread();
        break;
      case DrawerDestination.profile:
        setState(() {
          _drawerOverlayPage = const ProfileScreen();
          _drawerOverlayTitle = 'Profil';
        });
        break;

      case DrawerDestination.logout:
        _confirmLogout();
        break;
    }
  }

Future<void> _confirmLogout() async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Déconnexion'),
      content: const Text('Voulez-vous vraiment vous déconnecter ?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Annuler'),
        ),
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          style: TextButton.styleFrom(foregroundColor: Colors.red),
          child: const Text('Déconnexion'),
        ),
      ],
    ),
  );

  if (confirmed != true) return;
  if (!mounted) return;

  // 1. Stop le poll des messages non lus + déconnecte le socket
  _pollTimer?.cancel();
  try {
    SocketService().disconnect();
  } catch (_) {}

  // 2. ⚠️ EFFACE le token JWT et les données utilisateur
  //    (la clé est 'jwt' dans ton app, pas 'token')
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('jwt');
  await prefs.remove('user_data');
  // Optionnel — si tu veux tout nettoyer :
  // await prefs.clear();

  if (!mounted) return;

  // 3. Navigue vers le LoginScreen et VIDE toute la pile de navigation
  Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => const LoginScreen()),
    (route) => false,
  );
}
  void _onBottomTap(int i) {
    setState(() {
      _currentIndex = i;
      _drawerOverlayPage = null; // si on était sur une page overlay, on la ferme
    });
  }

  // ─── Bouton retour Android ────────────────────────────────────────────
  Future<bool> _onWillPop() async {
    // Si on est sur une page overlay (Factures, Messages, Profil), on revient
    // au bottom tab actuel.
    if (_drawerOverlayPage != null) {
      setState(() => _drawerOverlayPage = null);
      return false;
    }
    // Si on n'est pas sur Dashboard, on y revient.
    if (_currentIndex != 0) {
      setState(() => _currentIndex = 0);
      return false;
    }
    // Sinon, on quitte l'app.
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final isOverlay = _drawerOverlayPage != null;
    final currentTab = _bottomTabs[_currentIndex];

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: AppConstants.backgroundColor,

        // ── AppBar avec hamburger + cloche notif ────────────────────────
        appBar: AppBar(
          backgroundColor: AppConstants.surfaceColor,
          elevation: 0.5,
          iconTheme: const IconThemeData(color: AppConstants.textPrimary),
          title: Text(
            isOverlay ? _drawerOverlayTitle : currentTab.label,
            style: const TextStyle(
              color: AppConstants.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          // Si on est sur une page overlay, on affiche une flèche retour
          // au lieu du hamburger.
          leading: isOverlay
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () =>
                      setState(() => _drawerOverlayPage = null),
                )
              : null, // null → Flutter affiche automatiquement le hamburger
          actions: [
            // Cloche notif avec badge messages non lus
            _NotifBell(
              count: _unreadCount,
              onTap: () => navigateFromDrawer(DrawerDestination.messages),
            ),
            const SizedBox(width: 8),
          ],
        ),

        // ── Drawer (sidebar) ─────────────────────────────────────────────
        drawer: AppDrawer(
          currentDestination: _resolveCurrentDestination(),
          unreadMessages: _unreadCount,
          onSelect: navigateFromDrawer,
        ),

        
        body: IndexedStack(
       
          index: isOverlay ? _bottomTabs.length : _currentIndex,
          children: [
            ..._bottomTabs.map((t) => t.page),
            
            if (isOverlay) _drawerOverlayPage!
            else const SizedBox.shrink(),
          ],
        ),

        bottomNavigationBar: isOverlay
            ? null
            : NavigationBar(
                selectedIndex: _currentIndex,
                onDestinationSelected: _onBottomTap,
                backgroundColor: AppConstants.surfaceColor,
                indicatorColor:
                    AppConstants.primaryColor.withOpacity(0.15),
                destinations: _bottomTabs
                    .map((t) => NavigationDestination(
                          icon: Icon(t.icon),
                          selectedIcon: Icon(
                            t.activeIcon,
                            color: AppConstants.primaryColor,
                          ),
                          label: t.label,
                        ))
                    .toList(),
              ),
      ),
    );
  }

  /// Convertit l'état actuel (bottom index ou overlay) en DrawerDestination
  /// pour que le drawer surligne le bon item.
  DrawerDestination _resolveCurrentDestination() {
    if (_drawerOverlayPage != null) {
      if (_drawerOverlayTitle == 'Factures') return DrawerDestination.factures;
      if (_drawerOverlayTitle == 'Messages') return DrawerDestination.messages;
      if (_drawerOverlayTitle == 'Profil')   return DrawerDestination.profile;
    }
    switch (_currentIndex) {
      case 0: return DrawerDestination.dashboard;
      case 1: return DrawerDestination.clients;
      case 2: return DrawerDestination.catalogue;
      case 3: return DrawerDestination.commandes;
      default: return DrawerDestination.dashboard;
    }
  }
}

// ─── Modèle d'un onglet du bottom bar ──────────────────────────────────────
class _BottomTab {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final Widget page;

  const _BottomTab({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.page,
  });
}

// ─── Cloche de notification dans l'AppBar ─────────────────────────────────
class _NotifBell extends StatelessWidget {
  final int count;
  final VoidCallback onTap;
  const _NotifBell({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: onTap,
        ),
        if (count > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white, width: 1.5),
              ),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              child: Text(
                count > 99 ? '99+' : '$count',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }
}