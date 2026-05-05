import 'package:flutter/material.dart';
import '../../services/order_service.dart';
import '../../models/order.dart';
import '../../core/constants.dart';
import 'package:intl/intl.dart';
import '../../../core/app_colors.dart';
// ─── Filter options ───────────────────────────────────────────────────────────
class _FilterOption {
  final String label;
  final String? value; // null = All
  const _FilterOption(this.label, this.value);
}

const _filterOptions = [
  _FilterOption('All Orders', null),
  _FilterOption('Validées', 'valide'),
  _FilterOption('En Attente', 'en_attente'),
  _FilterOption('En Cours', 'en_cours'),
  _FilterOption('Annulées', 'annulee'),
];

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final OrderService _orderService = OrderService();

  // ── Raw data ──────────────────────────────────────────────────────────────
  List<Order> _allOrders = [];
  bool _loading = true;
  String? _error;

  // ── Filter / search state ─────────────────────────────────────────────────
  String? _selectedStatus; // null = show all
  String _searchQuery = '';

  // ── Pagination ────────────────────────────────────────────────────────────
  static const int _pageSize = 5;
  int _visibleCount = _pageSize;
  bool _showingAll = false;

  // ── Computed filtered list ────────────────────────────────────────────────
  List<Order> get _filtered {
    return _allOrders.where((o) {
      if (_selectedStatus != null) {
        final s = o.statut.toLowerCase();
        if (_selectedStatus == 'valide' &&
            !['validée', 'validee', 'valide'].contains(s)) return false;
        if (_selectedStatus == 'en_attente' && s != 'en_attente') return false;
        if (_selectedStatus == 'en_cours' &&
            !['en cours', 'en_cours'].contains(s)) return false;
        if (_selectedStatus == 'annulee' &&
            !['annulée', 'annulee'].contains(s)) return false;
      }
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final name =
            '${o.clientPrenom ?? ''} ${o.clientNom ?? ''}'.toLowerCase();
        final id = (o.id ?? '').toString().toLowerCase();
        if (!name.contains(q) && !id.contains(q)) return false;
      }
      return true;
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _loading = true;
      _error = null;
      _visibleCount = _pageSize;
      _showingAll = false;
    });
    try {
      final orders = await _orderService.getMyOrders();
      setState(() {
        _allOrders = orders;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _applyFilter(String? status) {
    setState(() {
      _selectedStatus = status;
      _visibleCount = _pageSize;
      _showingAll = false;
    });
  }

  void _applySearch(String query) {
    setState(() {
      _searchQuery = query;
      _visibleCount = _pageSize;
      _showingAll = false;
    });
  }

  void _loadMore() {
    final total = _filtered.length;
    setState(() {
      _visibleCount = (_visibleCount + _pageSize).clamp(0, total);
      if (_visibleCount >= total) _showingAll = true;
    });
  }

  void _viewAll() {
    setState(() {
      _visibleCount = _filtered.length;
      _showingAll = true;
    });
  }

  // ── Status helpers ─────────────────────────────────────────────────────────
  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'en_attente':
        return const Color(0xFF2563EB);
      case 'en cours':
      case 'en_cours':
        return const Color(0xFF0891B2);
      case 'validée':
      case 'validee':
      case 'valide':
        return const Color(0xFF16A34A);
      case 'annulée':
      case 'annulee':
        return AppConstants.errorColor;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String s) {
    switch (s.toLowerCase()) {
      case 'en_attente':
        return 'EN ATTENTE';
      case 'en cours':
      case 'en_cours':
        return 'EN COURS';
      case 'validée':
      case 'validee':
      case 'valide':
        return 'VALIDE';
      case 'annulée':
      case 'annulee':
        return 'ANNULÉE';
      default:
        return s.toUpperCase();
    }
  }

  IconData _statusIcon(String s) {
    switch (s.toLowerCase()) {
      case 'en_attente':
        return Icons.access_time_rounded;
      case 'en cours':
      case 'en_cours':
        return Icons.sync_rounded;
      case 'validée':
      case 'validee':
      case 'valide':
        return Icons.check_circle_outline_rounded;
      case 'annulée':
      case 'annulee':
        return Icons.cancel_outlined;
      default:
        return Icons.receipt_long_outlined;
    }
  }

  void _showOrderDetail(Order order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OrderDetailSheet(
        order: order,
        statusColor: _statusColor(order.statut),
        statusIcon: _statusIcon(order.statut),
        statusLabel: _statusLabel(order.statut),
      ),
    );
  }

  // ── Filter bottom sheet ────────────────────────────────────────────────────
  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Filter Orders',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Select a status to narrow results.',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
            ),
            const SizedBox(height: 16),
            ..._filterOptions.map((opt) {
              final isActive = _selectedStatus == opt.value;
              return InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () {
                  Navigator.pop(context);
                  _applyFilter(opt.value);
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 13),
                  decoration: BoxDecoration(
                    color: isActive
                        ? const Color(0xFF2563EB).withOpacity(0.07)
                        : const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isActive
                          ? const Color(0xFF2563EB)
                          : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          opt.label,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isActive
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isActive
                                ? const Color(0xFF2563EB)
                                : const Color(0xFF374151),
                          ),
                        ),
                      ),
                      if (isActive)
                        const Icon(Icons.check_rounded,
                            color: Color(0xFF2563EB), size: 18),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final visibleOrders = filtered.take(_visibleCount).toList();
    final hasMore = _visibleCount < filtered.length;
    final pendingCount = _allOrders
        .where((o) =>
            o.statut.toLowerCase().contains('attente') ||
            o.statut.toLowerCase().contains('cours'))
        .length;

    final activeFilters =
        (_selectedStatus != null ? 1 : 0) + (_searchQuery.isNotEmpty ? 1 : 0);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          'Orders',
          style: TextStyle(
            color: Color(0xFF111827),
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: Color(0xFF374151)),
            onPressed: () async {
              final result = await showSearch<String>(
                context: context,
                delegate: _OrderSearchDelegate(
                  allOrders: _allOrders,
                  onSelect: _showOrderDetail,
                  statusColor: _statusColor,
                  statusLabel: _statusLabel,
                ),
              );
              if (result != null) _applySearch(result);
            },
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.filter_list_rounded,
                    color: Color(0xFF374151)),
                onPressed: _showFilterSheet,
              ),
              if (activeFilters > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: const BoxDecoration(
                      color: Color(0xFF2563EB),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$activeFilters',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF2563EB)))
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _loadOrders)
              : RefreshIndicator(
                  onRefresh: _loadOrders,
                  color: const Color(0xFF2563EB),
                  child: ListView(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    children: [
                      if (_selectedStatus != null || _searchQuery.isNotEmpty)
                        _ActiveFiltersRow(
                          searchQuery: _searchQuery,
                          selectedStatus: _selectedStatus,
                          filterOptions: _filterOptions,
                          onClearSearch: () => _applySearch(''),
                          onClearStatus: () => _applyFilter(null),
                        ),

                      if (_searchQuery.isEmpty && _selectedStatus == null) ...[
                        const _SalesGrowthCard(),
                        const SizedBox(height: 12),
                        _PendingReviewBanner(count: pendingCount),
                        const SizedBox(height: 20),
                      ],

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _searchQuery.isNotEmpty || _selectedStatus != null
                                ? 'Results (${filtered.length})'
                                : _showingAll
                                    ? 'All Orders (${filtered.length})'
                                    : 'Recent Transactions',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF111827),
                            ),
                          ),
                          if (!_showingAll && filtered.length > _pageSize)
                            TextButton(
                              onPressed: _viewAll,
                              style: TextButton.styleFrom(
                                foregroundColor: const Color(0xFF2563EB),
                                padding: EdgeInsets.zero,
                                minimumSize: Size.zero,
                                tapTargetSize:
                                    MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: const Row(
                                children: [
                                  Text('View All',
                                      style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13)),
                                  SizedBox(width: 2),
                                  Icon(Icons.chevron_right_rounded,
                                      size: 16),
                                ],
                              ),
                            )
                          else if (_showingAll)
                            TextButton(
                              onPressed: () => setState(() {
                                _visibleCount = _pageSize;
                                _showingAll = false;
                              }),
                              style: TextButton.styleFrom(
                                foregroundColor: const Color(0xFF6B7280),
                                padding: EdgeInsets.zero,
                                minimumSize: Size.zero,
                                tapTargetSize:
                                    MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: const Text('Show less',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      if (filtered.isEmpty)
                        _EmptyFilterResult(
                          onClear: () {
                            _applySearch('');
                            _applyFilter(null);
                          },
                        )
                      else ...[
                        ...visibleOrders.map((order) => _OrderCard(
                              order: order,
                              statusColor: _statusColor(order.statut),
                              statusLabel: _statusLabel(order.statut),
                              onTap: () => _showOrderDetail(order),
                            )),

                        const SizedBox(height: 8),

                        if (hasMore)
                          TextButton(
                            onPressed: _loadMore,
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF2563EB),
                              padding:
                                  const EdgeInsets.symmetric(vertical: 14),
                              backgroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              'Load more  (${filtered.length - _visibleCount} remaining)',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14),
                            ),
                          )
                        else
                          Container(
                            alignment: Alignment.center,
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: const Color(0xFFE5E7EB)),
                            ),
                            child: Text(
                              'All ${filtered.length} orders loaded',
                              style: const TextStyle(
                                  color: Color(0xFF9CA3AF),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                      ],

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
      // FAB removed — orders are created from the catalogue panier only.
    );
  }
}

// ─── Active Filter Chips Row ──────────────────────────────────────────────────
class _ActiveFiltersRow extends StatelessWidget {
  final String searchQuery;
  final String? selectedStatus;
  final List<_FilterOption> filterOptions;
  final VoidCallback onClearSearch;
  final VoidCallback onClearStatus;

  const _ActiveFiltersRow({
    required this.searchQuery,
    required this.selectedStatus,
    required this.filterOptions,
    required this.onClearSearch,
    required this.onClearStatus,
  });

  @override
  Widget build(BuildContext context) {
    final statusLabel = selectedStatus != null
        ? filterOptions
            .firstWhere((o) => o.value == selectedStatus,
                orElse: () => const _FilterOption('', null))
            .label
        : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          if (searchQuery.isNotEmpty)
            _FilterChip(
              label: 'Search: "$searchQuery"',
              onRemove: onClearSearch,
            ),
          if (selectedStatus != null && statusLabel != null)
            _FilterChip(
              label: statusLabel,
              onRemove: onClearStatus,
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;
  const _FilterChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF2563EB).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.w600)),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close_rounded,
                size: 14, color: Color(0xFF2563EB)),
          ),
        ],
      ),
    );
  }
}

// ─── Empty Filter Result ──────────────────────────────────────────────────────
class _EmptyFilterResult extends StatelessWidget {
  final VoidCallback onClear;
  const _EmptyFilterResult({required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.search_off_rounded,
              size: 56, color: Color(0xFF9CA3AF)),
          const SizedBox(height: 16),
          const Text('No orders match your filters.',
              style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 15,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onClear,
            child: const Text('Clear all filters',
                style: TextStyle(
                    color: Color(0xFF2563EB), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

// ─── Error View ───────────────────────────────────────────────────────────────
class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded,
                size: 64, color: Color(0xFF9CA3AF)),
            const SizedBox(height: 16),
            Text('Erreur: $error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF6B7280))),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Réessayer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Search Delegate ──────────────────────────────────────────────────────────
class _OrderSearchDelegate extends SearchDelegate<String> {
  final List<Order> allOrders;
  final void Function(Order) onSelect;
  final Color Function(String) statusColor;
  final String Function(String) statusLabel;

  _OrderSearchDelegate({
    required this.allOrders,
    required this.onSelect,
    required this.statusColor,
    required this.statusLabel,
  });

  @override
  String get searchFieldLabel => 'Search by name or order ID…';

  @override
  ThemeData appBarTheme(BuildContext context) {
    return Theme.of(context).copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF111827),
        elevation: 0,
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: InputBorder.none,
        hintStyle: TextStyle(color: Color(0xFF9CA3AF)),
      ),
    );
  }

  @override
  List<Widget> buildActions(BuildContext context) => [
        if (query.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.clear_rounded),
            onPressed: () => query = '',
          ),
      ];

  @override
  Widget buildLeading(BuildContext context) => IconButton(
        icon: const Icon(Icons.arrow_back_rounded),
        onPressed: () => close(context, ''),
      );

  List<Order> get _results {
    if (query.isEmpty) return [];
    final q = query.toLowerCase();
    return allOrders.where((o) {
      final name =
          '${o.clientPrenom ?? ''} ${o.clientNom ?? ''}'.toLowerCase();
      final id = (o.id ?? '').toString().toLowerCase();
      return name.contains(q) || id.contains(q);
    }).toList();
  }

  @override
  Widget buildSuggestions(BuildContext context) => _buildList(context);

  @override
  Widget buildResults(BuildContext context) => _buildList(context);

  Widget _buildList(BuildContext context) {
    if (query.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_rounded, size: 48, color: Color(0xFFD1D5DB)),
            SizedBox(height: 12),
            Text('Type a client name or order ID',
                style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14)),
          ],
        ),
      );
    }

    final results = _results;

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off_rounded,
                size: 48, color: Color(0xFFD1D5DB)),
            const SizedBox(height: 12),
            Text('No results for "$query"',
                style: const TextStyle(
                    color: Color(0xFF6B7280), fontSize: 14)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final order = results[i];
        final clientName =
            '${order.clientPrenom ?? ''} ${order.clientNom ?? ''}'.trim();
        final color = statusColor(order.statut);
        final label = statusLabel(order.statut);
        final date = order.dateCreation != null
            ? DateFormat('MMM dd, yyyy • HH:mm')
                .format(DateTime.parse(order.dateCreation!))
            : 'N/A';

        return InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            close(context, query);
            onSelect(order);
          },
          child: Container(
            padding: const EdgeInsets.all(14),
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
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Center(
                    child: Text(
                      clientName.isNotEmpty
                          ? clientName
                              .split(' ')
                              .map((e) => e.isNotEmpty ? e[0] : '')
                              .take(2)
                              .join()
                              .toUpperCase()
                          : '#',
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF6B7280)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text('#ORD-${order.id ?? 'N/A'}',
                              style: const TextStyle(
                                  color: Color(0xFF2563EB),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: Text(label,
                                style: TextStyle(
                                    color: color,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                          clientName.isEmpty ? 'Client inconnu' : clientName,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF111827))),
                      Text(date,
                          style: const TextStyle(
                              fontSize: 11, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
                Text(
                  '${(order.totalTtc ?? 0.0).toStringAsFixed(3)} TND',
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF111827)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─── Sales Growth Card ────────────────────────────────────────────────────────
class _SalesGrowthCard extends StatelessWidget {
  const _SalesGrowthCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('MONTHLY SALES GROWTH',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF6B7280),
                        letterSpacing: 0.5)),
                SizedBox(height: 6),
                Text('+12.5%',
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB))),
                SizedBox(height: 6),
                Text(
                  'Efficient order management is driving higher\nprocurement velocity this quarter.',
                  style: TextStyle(
                      fontSize: 11, color: Color(0xFF9CA3AF), height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
              width: 80,
              height: 48,
              child: CustomPaint(painter: _SparklinePainter())),
        ],
      ),
    );
  }
}

class _SparklinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final points = [0.7, 0.4, 0.6, 0.3, 0.5, 0.2, 0.5];
    final paint = Paint()
      ..color = const Color(0xFFD1D5DB)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final path = Path();
    for (int i = 0; i < points.length; i++) {
      final x = (i / (points.length - 1)) * size.width;
      final y = points[i] * size.height;
      i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

// ─── Pending Review Banner ────────────────────────────────────────────────────
class _PendingReviewBanner extends StatelessWidget {
  final int count;
  const _PendingReviewBanner({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      decoration: BoxDecoration(
        color: const Color(0xFF2563EB),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
            child: const Icon(Icons.assignment_outlined,
                color: Colors.white, size: 28),
          ),
          const SizedBox(height: 12),
          const Text('PENDING REVIEW',
              style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0)),
          const SizedBox(height: 4),
          Text('$count',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  height: 1.1)),
        ],
      ),
    );
  }
}

// ─── Order Card ───────────────────────────────────────────────────────────────
class _OrderCard extends StatelessWidget {
  final Order order;
  final Color statusColor;
  final String statusLabel;
  final VoidCallback onTap;

  const _OrderCard({
    required this.order,
    required this.statusColor,
    required this.statusLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final date = order.dateCreation != null
        ? DateFormat('MMM dd, yyyy • HH:mm')
            .format(DateTime.parse(order.dateCreation!))
        : 'N/A';
    final clientName =
        '${order.clientPrenom ?? ''} ${order.clientNom ?? ''}'.trim();
    final initials = clientName.isNotEmpty
        ? clientName
            .split(' ')
            .map((e) => e.isNotEmpty ? e[0] : '')
            .take(2)
            .join()
        : '#';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 2))
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Center(
                  child: Text(initials.toUpperCase(),
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF6B7280))),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text('#ORD-${order.id ?? 'N/A'}',
                          style: const TextStyle(
                              color: Color(0xFF2563EB),
                              fontSize: 12,
                              fontWeight: FontWeight.w700)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(statusLabel,
                            style: TextStyle(
                                color: statusColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w700)),
                      ),
                    ]),
                    const SizedBox(height: 4),
                    Text(
                        clientName.isEmpty ? 'Client inconnu' : clientName,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF111827)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(date,
                        style: const TextStyle(
                            fontSize: 11, color: Color(0xFF9CA3AF))),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Total Amount',
                      style:
                          TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
                  const SizedBox(height: 2),
                  Text(
                    '${(order.totalTtc ?? 0.0).toStringAsFixed(3)} TND',
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827)),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded,
                  color: Color(0xFFD1D5DB), size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Order Detail Sheet ───────────────────────────────────────────────────────
class _OrderDetailSheet extends StatelessWidget {
  final Order order;
  final Color statusColor;
  final IconData statusIcon;
  final String statusLabel;

  const _OrderDetailSheet({
    required this.order,
    required this.statusColor,
    required this.statusIcon,
    required this.statusLabel,
  });

  @override
  Widget build(BuildContext context) {
    final date = order.dateCreation != null
        ? DateFormat('dd/MM/yyyy HH:mm')
            .format(DateTime.parse(order.dateCreation!))
        : 'N/A';

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
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                      color: const Color(0xFFE5E7EB),
                      borderRadius: BorderRadius.circular(4)),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Commande',
                          style: TextStyle(
                              color: Color(0xFF9CA3AF), fontSize: 13)),
                      const SizedBox(height: 2),
                      Text('#ORD-${order.id ?? 'N/A'}',
                          style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF111827))),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(statusIcon, color: statusColor, size: 16),
                        const SizedBox(width: 6),
                        Text(statusLabel,
                            style: TextStyle(
                                color: statusColor,
                                fontSize: 11,
                                fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const _SectionTitle('Client'),
              const SizedBox(height: 8),
              _InfoTile(
                icon: Icons.person_outline,
                label: 'Nom',
                value: '${order.clientPrenom ?? ''} ${order.clientNom ?? ''}'
                    .trim()
                    .isEmpty
                    ? 'N/A'
                    : '${order.clientPrenom ?? ''} ${order.clientNom ?? ''}'
                        .trim(),
              ),
              const SizedBox(height: 20),
              const _SectionTitle('Informations'),
              const SizedBox(height: 8),
              _InfoTile(
                icon: Icons.calendar_today_outlined,
                label: 'Date de création',
                value: date,
              ),
              _InfoTile(
                icon: Icons.tag_rounded,
                label: 'Référence',
                value: '#ORD-${order.id ?? 'N/A'}',
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withOpacity(0.07),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total TTC',
                        style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF374151))),
                    Text(
                        '${(order.totalTtc ?? 0.0).toStringAsFixed(3)} TND',
                        style: const TextStyle(
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.bold,
                            fontSize: 20)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded),
                  label: const Text('Fermer'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    foregroundColor: const Color(0xFF374151),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: Color(0xFF9CA3AF),
          letterSpacing: 0.8));
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoTile(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB).withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF2563EB), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 11, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 2),
                Text(value,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF111827))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}