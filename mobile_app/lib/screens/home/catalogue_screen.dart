import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/product_service.dart';
import '../../models/product.dart';
import '../../providers/cart_provider.dart';
import '../../core/constants.dart';

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
      builder: (_) => _CartSheet(cart: cart),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: const Text('Catalogue',
            style: TextStyle(
                color: AppConstants.textPrimary, fontWeight: FontWeight.bold)),
        backgroundColor: AppConstants.surfaceColor,
        elevation: 0,
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined,
                    color: AppConstants.textPrimary),
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
            color: AppConstants.surfaceColor,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Column(
              children: [
                // Search
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un produit...',
                    prefixIcon: const Icon(Icons.search_rounded,
                        color: AppConstants.textSecondary),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    filled: true,
                    fillColor: AppConstants.backgroundColor,
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
                Row(
                  children: ['Tous', 'En stock', 'Rupture'].map((label) {
                    final selected = _stockFilter == label;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(label),
                        selected: selected,
                        selectedColor: AppConstants.primaryColor,
                        labelStyle: TextStyle(
                          color: selected ? Colors.white : AppConstants.textSecondary,
                          fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                          fontSize: 12,
                        ),
                        backgroundColor: AppConstants.backgroundColor,
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
                    icon: const Icon(Icons.refresh_rounded,
                        size: 20, color: AppConstants.textSecondary),
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
              const Icon(Icons.wifi_off_rounded,
                  size: 64, color: AppConstants.textSecondary),
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
            const Icon(Icons.inventory_2_outlined,
                size: 64, color: AppConstants.textSecondary),
            const SizedBox(height: 16),
            const Text('Aucun produit trouvé',
                style: TextStyle(
                    fontSize: 16, color: AppConstants.textSecondary)),
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
          childAspectRatio: 0.70,
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
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildImage(),
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
                        product.enStock ? '${product.quantite} en stock' : 'Rupture',
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
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.nomCommercial,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (product.fournisseurSociete != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        product.fournisseurSociete!,
                        style: const TextStyle(
                            color: AppConstants.textSecondary, fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const Spacer(),
                    // Prix HT
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
                        style: const TextStyle(
                            color: AppConstants.textSecondary, fontSize: 10),
                      ),
                    const SizedBox(height: 8),
                    // Add to cart button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          backgroundColor: product.enStock
                              ? AppConstants.primaryColor
                              : Colors.grey.shade300,
                          foregroundColor:
                              product.enStock ? Colors.white : Colors.grey,
                          elevation: 0,
                        ),
                        onPressed: product.enStock
                            ? () {
                                context.read<CartProvider>().addItem(product);
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(SnackBar(
                                  content: Text(
                                      '${product.nomCommercial} ajouté au panier'),
                                  duration: const Duration(seconds: 1),
                                  backgroundColor: AppConstants.secondaryColor,
                                ));
                              }
                            : null,
                        child: const Text('Ajouter',
                            style: TextStyle(fontSize: 12)),
                      ),
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

  Widget _buildImage() {
    if (product.mainImage != null && product.mainImage!.isNotEmpty) {
      // base64 image
      if (product.mainImage!.startsWith('data:image')) {
        try {
          final base64Str = product.mainImage!.split(',').last;
          final bytes = base64Decode(base64Str);
          return Image.memory(bytes, fit: BoxFit.cover);
        } catch (_) {}
      }
      // URL image
      return Image.network(
        product.mainImage!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFFF0F4FF),
      child: const Center(
        child: Icon(Icons.inventory_2_outlined,
            size: 40, color: AppConstants.primaryColor),
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
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (_, sc) => SingleChildScrollView(
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
                      borderRadius: BorderRadius.circular(4))),
            ),
            Text(product.nomCommercial,
                style: Theme.of(context).textTheme.titleLarge),
            if (product.fournisseurSociete != null) ...[
              const SizedBox(height: 4),
              Text('Fournisseur : ${product.fournisseurSociete}',
                  style: Theme.of(context).textTheme.bodyMedium),
            ],
            const Divider(height: 24),
            _infoRow('Prix HT', '${product.prixVenteHt.toStringAsFixed(3)} TND'),
            if (product.tauxTva != null) ...[
              _infoRow('TVA', '${product.tauxTva}%'),
              _infoRow('Prix TTC', '${product.prixTtc.toStringAsFixed(3)} TND'),
            ],
            if (product.tauxFodec != null)
              _infoRow('Fodec', '${product.tauxFodec}%'),
            if (product.tauxDc != null) _infoRow('DC', '${product.tauxDc}%'),
            const Divider(height: 24),
            _infoRow(
              'Stock',
              product.enStock ? '${product.quantite} unité(s)' : 'Rupture de stock',
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
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text(
                              '${product.nomCommercial} ajouté au panier'),
                          backgroundColor: AppConstants.secondaryColor,
                        ));
                      }
                    : null,
                icon: const Icon(Icons.add_shopping_cart_rounded),
                label: Text(
                    product.enStock ? 'Ajouter au panier' : 'Rupture de stock'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(color: AppConstants.textSecondary)),
          Text(value,
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: valueColor ?? AppConstants.textPrimary)),
        ],
      ),
    );
  }
}

// ─── Cart Sheet ───────────────────────────────────────────────────────────────
class _CartSheet extends StatelessWidget {
  final CartProvider cart;
  const _CartSheet({required this.cart});

  @override
  Widget build(BuildContext context) {
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
                  onPressed: () {
                    cart.clear();
                    Navigator.pop(context);
                  },
                  child: const Text('Vider',
                      style: TextStyle(color: AppConstants.errorColor)),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Items
          Expanded(
            child: ListView.builder(
              controller: sc,
              itemCount: cart.items.length,
              itemBuilder: (context, index) {
                final item = cart.items.values.toList()[index];
                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
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
                        icon: const Icon(Icons.delete_outline_rounded,
                            color: AppConstants.errorColor, size: 20),
                        onPressed: () =>
                            cart.removeItem(item.product.id),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),
          // Total + Confirm
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
                    onPressed: () {
                      Navigator.pop(context);
                      // TODO: navigate to order confirmation screen
                    },
                    icon: const Icon(Icons.check_circle_outline_rounded),
                    label: const Text('Passer la commande'),
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
