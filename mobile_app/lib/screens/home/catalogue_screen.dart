import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/product_service.dart';
import '../../services/order_service.dart';
import '../../services/auth_service.dart';
import '../../services/user_service.dart';
import '../../models/product.dart';
import '../../models/order.dart';
import '../../models/user.dart';
import '../../providers/cart_provider.dart';
import '../../core/constants.dart';
import '../../core/app_colors.dart';
class CatalogueScreen extends StatefulWidget {
  const CatalogueScreen({super.key});

  @override
  State<CatalogueScreen> createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends State<CatalogueScreen> {
  final ProductService _productService = ProductService();
  List<Product> _allProducts = [];
  List<Product> _filtered = [];
  bool _isLoading = true;
  String? _error;
  String _search = '';
  String _stockFilter = 'Tous'; // 'Tous', 'En stock', 'Rupture'

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final products = await _productService.getProducts();
      setState(() {
        _allProducts = products;
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    _filtered = _allProducts.where((p) {
      final matchSearch = _search.isEmpty ||
          p.nomCommercial.toLowerCase().contains(_search.toLowerCase()) ||
          (p.fournisseurSociete?.toLowerCase().contains(_search.toLowerCase()) ?? false);
      final matchStock = _stockFilter == 'Tous' ||
          (_stockFilter == 'En stock' && p.enStock) ||
          (_stockFilter == 'Rupture' && !p.enStock);
      return matchSearch && matchStock;
    }).toList();
  }

  void _showCartSheet(BuildContext context) {
    final cart = context.read<CartProvider>();
    if (cart.itemCount == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Le panier est vide')),
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (_) => const _CartSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: AppColors.background(context),
      appBar: AppBar(
        title: Text('Catalogue',
            style: TextStyle(
                color: AppColors.textPrimary(context), fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.surface(context),
        elevation: 0,
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: Icon(Icons.shopping_cart_outlined,
                    color: AppColors.textPrimary(context)),
                onPressed: () => _showCartSheet(context),
              ),
              if (cart.itemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                        color: AppConstants.secondaryColor,
                        borderRadius: BorderRadius.circular(10)),
                    constraints:
                        const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text('${cart.itemCount}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // ── Search + Filter bar ───────────────────────────────────────────────
          Container(
            color: AppColors.surface(context),
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Column(
              children: [
                // Search
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un produit...',
                    prefixIcon: Icon(Icons.search_rounded,
                        color: AppColors.textSecondary(context)),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    filled: true,
                    fillColor: AppColors.background(context),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (v) {
                    setState(() {
                      _search = v;
                      _applyFilters();
                    });
                  },
                ),
                const SizedBox(height: 10),
                // Stock filter chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['Tous', 'En stock', 'Rupture'].map((label) {
                      final selected = _stockFilter == label;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(label),
                          selected: selected,
                          selectedColor: AppConstants.primaryColor,
                          labelStyle: TextStyle(
                            color: selected ? Colors.white : AppColors.textSecondary(context),
                            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                            fontSize: 12,
                          ),
                          backgroundColor: AppColors.background(context),
                          side: BorderSide.none,
                          onSelected: (_) {
                            setState(() {
                              _stockFilter = label;
                              _applyFilters();
                            });
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // ── Results count ─────────────────────────────────────────────────────
          if (!_isLoading && _error == null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
              child: Row(
                children: [
                  Text(
                    '${_filtered.length} produit(s)',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium!
                        .copyWith(fontWeight: FontWeight.w500),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(Icons.refresh_rounded,
                        size: 20, color: AppColors.textSecondary(context)),
                    onPressed: _loadProducts,
                    tooltip: 'Actualiser',
                  ),
                ],
              ),
            ),

          // ── Content ───────────────────────────────────────────────────────────
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: AppConstants.primaryColor));
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.wifi_off_rounded,
                  size: 64, color: AppColors.textSecondary(context)),
              const SizedBox(height: 16),
              Text('Erreur de chargement',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadProducts,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }
    if (_filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inventory_2_outlined,
                size: 64, color: AppColors.textSecondary(context)),
            const SizedBox(height: 16),
            Text('Aucun produit trouvé',
                style: TextStyle(
                    fontSize: 16, color: AppColors.textSecondary(context))),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadProducts,
      color: AppConstants.primaryColor,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.62,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: _filtered.length,
        itemBuilder: (context, index) {
          return _ProductCard(product: _filtered[index]);
        },
      ),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/// Smart image builder that handles every common case:
/// - data:image/...;base64,xxxx  → decode base64
/// - http(s)://...                → load as network image
/// - /uploads/abc.jpg or uploads/abc.jpg → prepend API base URL
/// - raw base64 string            → try to decode as base64
/// - null / empty                 → placeholder
Widget buildProductImage(String? rawImage, {BoxFit fit = BoxFit.cover}) {
  Widget placeholder() => Container(
        color: const Color(0xFFF0F4FF),
        child: const Center(
          child: Icon(Icons.inventory_2_outlined,
              size: 40, color: AppConstants.primaryColor),
        ),
      );

  if (rawImage == null || rawImage.trim().isEmpty) {
    return placeholder();
  }

  final img = rawImage.trim();

  // 1. data:image/xxx;base64,...
  if (img.startsWith('data:image')) {
    try {
      final bytes = base64Decode(img.split(',').last);
      return Image.memory(bytes, fit: fit);
    } catch (_) {
      return placeholder();
    }
  }

  // 2. Full URL
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return Image.network(
      img,
      fit: fit,
      errorBuilder: (_, __, ___) => placeholder(),
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return Container(
          color: const Color(0xFFF0F4FF),
          child: const Center(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: AppConstants.primaryColor),
            ),
          ),
        );
      },
    );
  }

  // 3. Relative path (e.g. /uploads/abc.jpg) → prepend API base URL
  //    Strip a trailing /api segment so we hit the static-files host root.
  if (img.startsWith('/') ||
      img.startsWith('uploads') ||
      img.contains('.jpg') ||
      img.contains('.jpeg') ||
      img.contains('.png') ||
      img.contains('.webp')) {
    final base = AppConstants.baseUrl.replaceAll(RegExp(r'/api/?$'), '');
    final fullUrl = img.startsWith('/') ? '$base$img' : '$base/$img';
    return Image.network(
      fullUrl,
      fit: fit,
      errorBuilder: (_, __, ___) => placeholder(),
    );
  }

  // 4. Last resort: try raw base64
  try {
    final bytes = base64Decode(img);
    return Image.memory(bytes, fit: fit);
  } catch (_) {
    return placeholder();
  }
}

// ─── Product Card ─────────────────────────────────────────────────────────────
class _ProductCard extends StatelessWidget {
  final Product product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      shadowColor: Colors.black12,
      child: InkWell(
        onTap: () => _showProductDetail(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Image zone ──────────────────────────────────────────────────
            Expanded(
              flex: 4,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  buildProductImage(product.mainImage),
                  // Stock badge
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: product.enStock
                            ? AppConstants.secondaryColor
                            : AppConstants.errorColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        product.enStock
                            ? '${product.quantite} en stock'
                            : 'Rupture',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Info zone ───────────────────────────────────────────────────
            Expanded(
              flex: 5,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    // ── Top: name + supplier ──────────────────────────────
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          product.nomCommercial,
                          style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: AppColors.textPrimary(context)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (product.fournisseurSociete != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            product.fournisseurSociete!,
                            style: TextStyle(
                                color: AppColors.textSecondary(context),
                                fontSize: 11),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),

                    // ── Bottom: prices + button ────────────────────────────
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${product.prixVenteHt.toStringAsFixed(3)} TND HT',
                          style: const TextStyle(
                              color: AppConstants.primaryColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 13),
                        ),
                        if (product.tauxTva != null)
                          Text(
                            '${product.prixTtc.toStringAsFixed(3)} TND TTC',
                            style: TextStyle(
                                color: AppColors.textSecondary(context),
                                fontSize: 10),
                          ),
                        const SizedBox(height: 6),
                        SizedBox(
                          width: double.infinity,
                          height: 32,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              padding: EdgeInsets.zero,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              backgroundColor: product.enStock
                                  ? AppConstants.primaryColor
                                  : Colors.grey.shade300,
                              foregroundColor: product.enStock
                                  ? Colors.white
                                  : Colors.grey,
                              elevation: 0,
                            ),
                            onPressed: product.enStock
                                ? () {
                                    context
                                        .read<CartProvider>()
                                        .addItem(product);
                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(SnackBar(
                                      content: Text(
                                          '${product.nomCommercial} ajouté au panier'),
                                      duration: const Duration(seconds: 1),
                                      backgroundColor:
                                          AppConstants.secondaryColor,
                                    ));
                                  }
                                : null,
                            child: const Text('Ajouter',
                                style: TextStyle(fontSize: 12)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showProductDetail(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (_) => _ProductDetailSheet(product: product),
    );
  }
}

// ─── Product Detail Sheet ─────────────────────────────────────────────────────
class _ProductDetailSheet extends StatelessWidget {
  final Product product;
  const _ProductDetailSheet({required this.product});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      expand: false,
      builder: (_, sc) => SingleChildScrollView(
        controller: sc,
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image at the top of the detail sheet ───────────────────────
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(24)),
              child: SizedBox(
                height: 220,
                width: double.infinity,
                child: buildProductImage(product.mainImage),
              ),
            ),
            Padding(
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
                          borderRadius: BorderRadius.circular(4)),
                    ),
                  ),
                  Text(product.nomCommercial,
                      style: Theme.of(context).textTheme.titleLarge),
                  if (product.fournisseurSociete != null) ...[
                    const SizedBox(height: 4),
                    Text('Fournisseur : ${product.fournisseurSociete}',
                        style: Theme.of(context).textTheme.bodyMedium),
                  ],
                  const Divider(height: 24),
                  _infoRow(context, 'Prix HT',
                      '${product.prixVenteHt.toStringAsFixed(3)} TND'),
                  if (product.tauxTva != null) ...[
                    _infoRow(context, 'TVA', '${product.tauxTva}%'),
                    _infoRow(context, 'Prix TTC',
                        '${product.prixTtc.toStringAsFixed(3)} TND'),
                  ],
                  if (product.tauxFodec != null)
                    _infoRow(context, 'Fodec', '${product.tauxFodec}%'),
                  if (product.tauxDc != null)
                    _infoRow(context, 'DC', '${product.tauxDc}%'),
                  const Divider(height: 24),
                  _infoRow(
                    context,
                    'Stock',
                    product.enStock
                        ? '${product.quantite} unité(s)'
                        : 'Rupture de stock',
                    valueColor: product.enStock
                        ? AppConstants.secondaryColor
                        : AppConstants.errorColor,
                  ),
                  if (product.descriptionInterne != null &&
                      product.descriptionInterne!.isNotEmpty) ...[
                    const Divider(height: 24),
                    Text('Description',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge!
                            .copyWith(fontSize: 15)),
                    const SizedBox(height: 8),
                    Text(product.descriptionInterne!,
                        style: Theme.of(context).textTheme.bodyMedium),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: product.enStock
                          ? () {
                              context.read<CartProvider>().addItem(product);
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(SnackBar(
                                content: Text(
                                    '${product.nomCommercial} ajouté au panier'),
                                backgroundColor: AppConstants.secondaryColor,
                              ));
                            }
                          : null,
                      icon: const Icon(Icons.add_shopping_cart_rounded),
                      label: Text(product.enStock
                          ? 'Ajouter au panier'
                          : 'Rupture de stock'),
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

  Widget _infoRow(BuildContext context, String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(color: AppColors.textSecondary(context))),
          Text(value,
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: valueColor ?? AppColors.textPrimary(context))),
        ],
      ),
    );
  }
}

// ─── Cart Sheet ───────────────────────────────────────────────────────────────
class _CartSheet extends StatefulWidget {
  const _CartSheet();

  @override
  State<_CartSheet> createState() => _CartSheetState();
}

class _CartSheetState extends State<_CartSheet> {
  final OrderService _orderService = OrderService();
  bool _isSubmitting = false;

  /// Étape 1 : ouvre la popup de finalisation (choix client + trimestre).
  /// Étape 2 : appelle le backend.
  Future<void> _onPasserCommandeTap(BuildContext context) async {
    final cart = context.read<CartProvider>();

    // Récupère l'utilisateur connecté depuis SharedPreferences
    final me = await AuthService().getUserFromPrefs();
    if (me == null || me.id == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erreur : session expirée, veuillez vous reconnecter'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    // Vérifie que c'est bien un commercial (le backend exige role=COMMERCIAL)
    final myRole = (me.role ?? '').toUpperCase();
    if (myRole != 'COMMERCIAL' && myRole != 'ADMIN') {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Seul un commercial peut passer une commande de vente.'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    // Ouvre la popup de finalisation
    final result = await showModalBottomSheet<_CheckoutResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CheckoutSheet(cartTotal: cart.totalAmount),
    );

    if (result == null || !mounted) return;

    // Construit la liste d'OrderItem à partir du panier
    final items = cart.items.values.map((cartItem) {
      return OrderItem(
        idProduit: cartItem.product.id,
        quantite: cartItem.quantity,
        prixUnitaireHtAp: cartItem.product.prixVenteHt,
      );
    }).toList();

    setState(() => _isSubmitting = true);
    try {
      await _orderService.createOrder(
        idClient: result.idClient,
        idCommercial: me.id!,
        trimestre: result.trimestre,
        items: items,
      );

      cart.clear();
      if (!mounted) return;
      Navigator.pop(context); // ferme le panier

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Commande passée avec succès !'),
          backgroundColor: AppConstants.secondaryColor,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Erreur : ${e.toString().replaceAll("Exception: ", "")}'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // ⚡ context.watch → le sheet se rebuild à chaque changement du panier
    //    (suppression d'un item, vidage, ajout, etc.)
    final cart = context.watch<CartProvider>();
    final items = cart.items.values.toList();

    // Si on vient de supprimer le dernier item, on ferme le sheet automatiquement
    if (items.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && Navigator.canPop(context)) Navigator.pop(context);
      });
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      maxChildSize: 0.9,
      minChildSize: 0.3,
      expand: false,
      builder: (_, sc) => Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(4)),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Text('Mon panier',
                    style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                TextButton(
                  onPressed: _isSubmitting
                      ? null
                      : () {
                          cart.clear();
                          // pas besoin de Navigator.pop : le post-frame
                          // callback ci-dessus s'en charge quand items est vide
                        },
                  child: const Text('Vider',
                      style: TextStyle(color: AppConstants.errorColor)),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Items list
          Expanded(
            child: ListView.builder(
              controller: sc,
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return ListTile(
                  key: ValueKey(item.product.id),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      width: 48,
                      height: 48,
                      child: buildProductImage(item.product.mainImage),
                    ),
                  ),
                  title: Text(item.product.nomCommercial,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(
                      '${item.product.prixVenteHt.toStringAsFixed(3)} TND × ${item.quantity}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${item.total.toStringAsFixed(3)} TND',
                        style: const TextStyle(
                            color: AppConstants.primaryColor,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        tooltip: 'Supprimer',
                        icon: const Icon(Icons.delete_outline_rounded,
                            color: AppConstants.errorColor, size: 20),
                        onPressed: _isSubmitting
                            ? null
                            : () {
                                cart.removeItem(item.product.id);
                              },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),

          // Total + Confirm button
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total HT',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(
                      '${cart.totalAmount.toStringAsFixed(3)} TND',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppConstants.primaryColor),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting
                        ? null
                        : () => _onPasserCommandeTap(context),
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.check_circle_outline_rounded),
                    label: Text(
                        _isSubmitting ? 'Envoi...' : 'Passer la commande'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Checkout Result ──────────────────────────────────────────────────────────
class _CheckoutResult {
  final int idClient;
  final String trimestre;
  const _CheckoutResult({required this.idClient, required this.trimestre});
}

// ─── Checkout Sheet (popup de finalisation) ───────────────────────────────────
class _CheckoutSheet extends StatefulWidget {
  final double cartTotal;
  const _CheckoutSheet({required this.cartTotal});

  @override
  State<_CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends State<_CheckoutSheet> {
  final UserService _userService = UserService();
  List<User> _clients = [];
  bool _loading = true;
  String? _error;

  User? _selectedClient;
  String? _selectedTrimestre;

  static const _trimestres = ['T1', 'T2', 'T3', 'T4'];

  @override
  void initState() {
    super.initState();
    _loadClients();
  }

  Future<void> _loadClients() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final clients = await _userService.getClients();
      if (!mounted) return;
      setState(() {
        _clients = clients;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  bool get _canConfirm =>
      _selectedClient != null && _selectedTrimestre != null && !_loading;

  void _confirm() {
    if (!_canConfirm) return;
    Navigator.pop(
      context,
      _CheckoutResult(
        idClient: _selectedClient!.id!,
        trimestre: _selectedTrimestre!,
      ),
    );
  }

  String _displayName(User u) {
    final full = '${u.prenom ?? ''} ${u.nom ?? ''}'.trim();
    if (full.isNotEmpty) return full;
    return u.email ?? 'Client #${u.id}';
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
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
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppColors.border(context),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              Text(
                'Finaliser la commande',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary(context),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Choisissez le client et le trimestre.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary(context)),
              ),
              const SizedBox(height: 24),

              // ── Client picker ─────────────────────────────────────
              Text(
                'Client *',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary(context),
                ),
              ),
              const SizedBox(height: 6),
              if (_loading)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.inputFill(context),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border(context)),
                  ),
                  child: const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppConstants.primaryColor,
                    ),
                  ),
                )
              else if (_error != null)
                _ErrorTile(message: _error!, onRetry: _loadClients)
              else if (_clients.isEmpty)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFED7AA)),
                  ),
                  child: const Text(
                    'Aucun client disponible.',
                    style: TextStyle(
                        color: Color(0xFF9A3412), fontSize: 13),
                  ),
                )
              else
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border(context)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<User>(
                      isExpanded: true,
                      value: _selectedClient,
                      hint: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 14),
                        child: Text('Sélectionner un client',
                            style: TextStyle(color: AppColors.border(context))),
                      ),
                      icon: Padding(
                        padding: EdgeInsets.only(right: 12),
                        child: Icon(Icons.keyboard_arrow_down_rounded,
                            color: AppColors.textMuted(context)),
                      ),
                      borderRadius: BorderRadius.circular(10),
                      items: _clients.map((c) {
                        return DropdownMenuItem<User>(
                          value: c,
                          child: Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 14),
                            child: Text(
                              _displayName(c),
                              style: TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textPrimary(context)),
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (u) => setState(() => _selectedClient = u),
                    ),
                  ),
                ),
              const SizedBox(height: 18),

              // ── Trimestre picker ───────────────────────────────────
              Text(
                'Trimestre *',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary(context),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: _trimestres.map((t) {
                  final isActive = _selectedTrimestre == t;
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                          right: t == _trimestres.last ? 0 : 8),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () =>
                            setState(() => _selectedTrimestre = t),
                        child: Container(
                          padding:
                              const EdgeInsets.symmetric(vertical: 14),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isActive
                                ? AppConstants.primaryColor
                                    .withOpacity(0.1)
                                : AppColors.inputFill(context),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isActive
                                  ? AppConstants.primaryColor
                                  : AppColors.border(context),
                              width: isActive ? 1.5 : 1,
                            ),
                          ),
                          child: Text(
                            t,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: isActive
                                  ? AppConstants.primaryColor
                                  : AppColors.textSecondary(context),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // ── Récapitulatif total ────────────────────────────────
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppConstants.primaryColor.withOpacity(0.07),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total HT',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary(context)),
                    ),
                    Text(
                      '${widget.cartTotal.toStringAsFixed(3)} TND',
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppConstants.primaryColor),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Boutons ────────────────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding:
                            const EdgeInsets.symmetric(vertical: 14),
                        foregroundColor: AppColors.textSecondary(context),
                        side: BorderSide(color: AppColors.border(context)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Annuler'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _canConfirm ? _confirm : null,
                      icon: const Icon(Icons.check_rounded),
                      label: const Text('Confirmer'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryColor,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: AppColors.border(context),
                        disabledForegroundColor: AppColors.textMuted(context),
                        padding:
                            const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorTile extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorTile({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.errorPale(context),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.errorBorder(context)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Erreur : $message',
              style:
                  const TextStyle(color: Color(0xFFB91C1C), fontSize: 13),
            ),
          ),
          TextButton(
            onPressed: onRetry,
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }
}