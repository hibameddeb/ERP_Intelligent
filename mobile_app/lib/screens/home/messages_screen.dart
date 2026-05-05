// lib/screens/main/messages_screen.dart
//
// Écran "Messages" — liste des contacts du chat (clients pour un commercial,
// commercial pour un client). Tape sur un contact pour ouvrir la conversation.

import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/message.dart';
import '../../services/message_service.dart';
import '../../services/socket_service.dart';
import 'chat_screen.dart';
import '../../../core/app_colors.dart';
class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final MessageService _service = MessageService();
  late Future<List<ChatContact>> _future;
  String _search = '';

  void Function()? _unsubMessageNew;

  @override
  void initState() {
    super.initState();
    _future = _service.getContacts();

    // Refresh la liste quand un nouveau message arrive
    _unsubMessageNew = SocketService().onMessageNew((_) {
      if (mounted) _refresh();
    });
  }

  @override
  void dispose() {
    _unsubMessageNew?.call();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = _service.getContacts();
    });
    await _future;
  }

  void _openChat(ChatContact contact) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ChatScreen(contact: contact)),
    );
    // Au retour de la conversation, on recharge la liste pour mettre à jour
    // le compteur non-lus et le dernier message.
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: const Text(
          'Messages',
          style: TextStyle(
            color: AppConstants.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppConstants.surfaceColor,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppConstants.textPrimary),
      ),
      body: Column(
        children: [
          // ── Barre de recherche ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Rechercher un contact…',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: AppConstants.surfaceColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (v) => setState(() => _search = v.trim().toLowerCase()),
            ),
          ),

          // ── Liste des contacts ──────────────────────────────────────────
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: FutureBuilder<List<ChatContact>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snap.hasError) {
                    return _ErrorBox(
                      message: '${snap.error}',
                      onRetry: _refresh,
                    );
                  }
                  final all = snap.data ?? [];
                  final filtered = _search.isEmpty
                      ? all
                      : all.where((c) {
                          return c.fullName.toLowerCase().contains(_search) ||
                              c.email.toLowerCase().contains(_search);
                        }).toList();

                  if (filtered.isEmpty) {
                    return ListView(
                      // permet le pull-to-refresh même quand vide
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 120),
                        Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Column(
                              children: [
                                Icon(Icons.chat_bubble_outline,
                                    size: 64, color: Colors.grey),
                                SizedBox(height: 12),
                                Text('Aucun contact disponible',
                                    style: TextStyle(color: Colors.grey)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  }

                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const Divider(
                      height: 1,
                      indent: 80,
                      endIndent: 16,
                    ),
                    itemBuilder: (_, i) => _ContactTile(
                      contact: filtered[i],
                      onTap: () => _openChat(filtered[i]),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Tuile d'un contact ───────────────────────────────────────────────────
class _ContactTile extends StatelessWidget {
  final ChatContact contact;
  final VoidCallback onTap;

  const _ContactTile({required this.contact, required this.onTap});

  String _formatDate(DateTime? d) {
    if (d == null) return '';
    final now = DateTime.now();
    final diff = now.difference(d);
    if (diff.inDays == 0) {
      return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return 'Hier';
    } else if (diff.inDays < 7) {
      const j = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      return j[d.weekday - 1];
    }
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final initials = ((contact.prenom.isNotEmpty ? contact.prenom[0] : '') +
            (contact.nom.isNotEmpty ? contact.nom[0] : ''))
        .toUpperCase();
    final hasUnread = contact.unreadCount > 0;

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        radius: 26,
        backgroundColor: AppConstants.primaryColor.withOpacity(0.15),
        backgroundImage: (contact.avatar != null && contact.avatar!.isNotEmpty)
            ? NetworkImage(_resolveAvatar(contact.avatar!))
            : null,
        child: (contact.avatar == null || contact.avatar!.isEmpty)
            ? Text(
                initials.isEmpty ? '?' : initials,
                style: const TextStyle(
                  color: AppConstants.primaryColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              )
            : null,
      ),
      title: Text(
        contact.fullName,
        style: TextStyle(
          fontWeight: hasUnread ? FontWeight.bold : FontWeight.w600,
          color: AppConstants.textPrimary,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        contact.lastMessage ?? 'Aucun message',
        style: TextStyle(
          color: hasUnread ? AppConstants.textPrimary : Colors.grey,
          fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            _formatDate(contact.lastMessageDate),
            style: TextStyle(
              fontSize: 12,
              color: hasUnread ? AppConstants.primaryColor : Colors.grey,
              fontWeight: hasUnread ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          const SizedBox(height: 4),
          if (hasUnread)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: AppConstants.primaryColor,
                borderRadius: BorderRadius.circular(12),
              ),
              constraints: const BoxConstraints(minWidth: 22),
              child: Text(
                contact.unreadCount > 99
                    ? '99+'
                    : contact.unreadCount.toString(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          else
            const SizedBox(height: 18),
        ],
      ),
    );
  }

  String _resolveAvatar(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final base = AppConstants.apiBaseUrl.replaceAll(RegExp(r'/api/?$'), '');
    return url.startsWith('/') ? '$base$url' : '$base/$url';
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorBox({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }
}