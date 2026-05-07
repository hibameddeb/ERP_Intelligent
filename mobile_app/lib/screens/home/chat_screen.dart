
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_app/models/message.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants.dart';
import '../../models/message.dart' as message_model;
import '../../services/socket_service.dart';
import '../../services/message_service.dart';
import '../../../core/app_colors.dart';
class ChatScreen extends StatefulWidget {
  final message_model.ChatContact contact;
  const ChatScreen({super.key, required this.contact});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final MessageService _messageService = MessageService();
  final SocketService _socketService = SocketService();
  final TextEditingController _input = TextEditingController();
  final ScrollController _scroll = ScrollController();

  List<Message> _messages = [];
  bool _loading = true;
  bool _sending = false;
  bool _otherIsTyping = false;
  int? _myUserId;

  Timer? _typingDebounce;
  Timer? _typingStopTimer;
  bool _typingEmitted = false;

  // Désinscriptions des écouteurs socket
  void Function()? _unsubMessageNew;
  void Function()? _unsubMessageRead;
  void Function()? _unsubTypingStart;
  void Function()? _unsubTypingStop;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _loadMyId();
    await _loadConversation();
    _attachSocketListeners();
    // Marque comme lu à l'ouverture
    SocketService().emitMessageRead(widget.contact.id);
  }

 Future<void> _loadMyId() async {
  final prefs = await SharedPreferences.getInstance();
  final raw = prefs.getString('user_data'); // ← clé utilisée par auth_service
  if (raw == null || raw.isEmpty) return;
 
  try {
    final m = jsonDecode(raw) as Map<String, dynamic>;
    final rawId = m['id'];
    _myUserId = rawId is int
        ? rawId
        : int.tryParse(rawId?.toString() ?? '');
  } catch (e) {
    // ignore: avoid_print
    print('[CHAT] Erreur parse user_data: $e');
  }
}
  Future<void> _loadConversation() async {
    setState(() => _loading = true);
    try {
      final list = await _messageService.getConversation(widget.contact.id);
      if (!mounted) return;
      setState(() {
        _messages = list;
        _loading = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  void _attachSocketListeners() {
    final socket = SocketService();

    _unsubMessageNew = socket.onMessageNew((data) {
      if (!mounted) return;
      try {
        final msg = Message.fromJson(Map<String, dynamic>.from(data));
        // On ne garde que les messages de cette conversation
        final involvesMe = msg.idExpediteur == _myUserId ||
            msg.idDestinataire == _myUserId;
        final involvesContact = msg.idExpediteur == widget.contact.id ||
            msg.idDestinataire == widget.contact.id;
        if (!involvesMe || !involvesContact) return;

        // Évite les doublons (le sender l'a déjà ajouté localement)
        final exists = _messages.any((m) => m.id == msg.id);
        if (exists) return;

        setState(() => _messages.add(msg));
        _scrollToBottom();

        // Si le message vient du contact, on le marque comme lu
        if (msg.idExpediteur == widget.contact.id) {
          _messageService.markAsRead(widget.contact.id).catchError((_) {});
          socket.emitMessageRead(widget.contact.id);
        }
      } catch (_) {}
    });

    _unsubMessageRead = socket.onMessageRead((data) {
      if (!mounted) return;
      // L'autre a lu mes messages → on les passe tous en "lu"
      setState(() {
        _messages = _messages.map((m) {
          if (m.idExpediteur == _myUserId && !m.lu) {
            return Message(
              id: m.id,
              idExpediteur: m.idExpediteur,
              idDestinataire: m.idDestinataire,
              contenu: m.contenu,
              lu: true,
              dateEnvoi: m.dateEnvoi,
              nom: m.nom,
              prenom: m.prenom,
              avatar: m.avatar,
            );
          }
          return m;
        }).toList();
      });
    });

    _unsubTypingStart = socket.onTypingStart((data) {
      if (!mounted) return;
      try {
        final from = (data is Map && data['from'] != null)
            ? int.tryParse(data['from'].toString())
            : null;
        if (from == widget.contact.id) {
          setState(() => _otherIsTyping = true);
        }
      } catch (_) {}
    });

    _unsubTypingStop = socket.onTypingStop((data) {
      if (!mounted) return;
      try {
        final from = (data is Map && data['from'] != null)
            ? int.tryParse(data['from'].toString())
            : null;
        if (from == widget.contact.id) {
          setState(() => _otherIsTyping = false);
        }
      } catch (_) {}
    });
  }

  // ─── Envoi ────────────────────────────────────────────────────────────
  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() => _sending = true);
    _input.clear();
    _stopTyping();

    try {
      final saved = await _messageService.sendMessage(
        destinataireId: widget.contact.id,
        contenu: text,
      );
      if (!mounted) return;
      // Ajout local immédiat (le socket peut aussi le renvoyer, déduplication ci-dessus)
      final exists = _messages.any((m) => m.id == saved.id);
      if (!exists) {
        setState(() => _messages.add(saved));
      }
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Échec d\'envoi: $e')),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  // ─── Indicateur "en train d'écrire" ───────────────────────────────────
  void _onInputChanged(String _) {
    if (!_typingEmitted) {
      SocketService().emitTypingStart(widget.contact.id);
      _typingEmitted = true;
    }
    _typingStopTimer?.cancel();
    _typingStopTimer = Timer(const Duration(seconds: 2), _stopTyping);
  }

  void _stopTyping() {
    if (_typingEmitted) {
      SocketService().emitTypingStop(widget.contact.id);
      _typingEmitted = false;
    }
    _typingStopTimer?.cancel();
  }

  // ─── Scroll ────────────────────────────────────────────────────────────
  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _stopTyping();
    _typingDebounce?.cancel();
    _typingStopTimer?.cancel();
    _unsubMessageNew?.call();
    _unsubMessageRead?.call();
    _unsubTypingStart?.call();
    _unsubTypingStop?.call();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  // ─── UI ────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final initials =
        ((widget.contact.prenom.isNotEmpty ? widget.contact.prenom[0] : '') +
                (widget.contact.nom.isNotEmpty ? widget.contact.nom[0] : ''))
            .toUpperCase();

    return Scaffold(
      backgroundColor: AppColors.background(context),
      appBar: AppBar(
        backgroundColor: AppColors.surface(context),
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.textPrimary(context)),
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: AppConstants.primaryColor.withOpacity(0.15),
              backgroundImage: (widget.contact.avatar != null &&
                      widget.contact.avatar!.isNotEmpty)
                  ? NetworkImage(_resolveAvatar(widget.contact.avatar!))
                  : null,
              child: (widget.contact.avatar == null ||
                      widget.contact.avatar!.isEmpty)
                  ? Text(
                      initials.isEmpty ? '?' : initials,
                      style: const TextStyle(
                        color: AppConstants.primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.contact.fullName,
                    style: TextStyle(
                      color: AppColors.textPrimary(context),
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (_otherIsTyping)
                    const Text(
                      'en train d\'écrire…',
                      style: TextStyle(
                        color: AppConstants.primaryColor,
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  else
                    Text(
                      widget.contact.role,
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : (_messages.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.forum_outlined,
                                  size: 64, color: Colors.grey),
                              SizedBox(height: 12),
                              Text(
                                'Démarrez la conversation',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final msg = _messages[i];
                          final mine = msg.isMine(_myUserId ?? -1);
                          final showDateHeader = i == 0 ||
                              !_sameDay(_messages[i - 1].dateEnvoi,
                                  msg.dateEnvoi);
                          return Column(
                            children: [
                              if (showDateHeader) _DateHeader(date: msg.dateEnvoi),
                              _Bubble(message: msg, mine: mine),
                            ],
                          );
                        },
                      )),
          ),

          // ── Composer ────────────────────────────────────────────────────
          SafeArea(
            top: false,
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surface(context),
                border: Border(
                  top: BorderSide(color: Colors.black12, width: 0.5),
                ),
              ),
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      onChanged: _onInputChanged,
                      minLines: 1,
                      maxLines: 5,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Écrire un message…',
                        filled: true,
                        fillColor: AppColors.background(context),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: AppConstants.primaryColor,
                    borderRadius: BorderRadius.circular(24),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(24),
                      onTap: _sending ? null : _send,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        child: _sending
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.send, color: Colors.white),
                      ),
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

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  String _resolveAvatar(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final base = AppConstants.apiBaseUrl.replaceAll(RegExp(r'/api/?$'), '');
    return url.startsWith('/') ? '$base$url' : '$base/$url';
  }
}

// ─── Bulle de message ─────────────────────────────────────────────────────
class _Bubble extends StatelessWidget {
  final Message message;
  final bool mine;
  const _Bubble({required this.message, required this.mine});

  String _formatTime(DateTime d) =>
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final bg = mine
        ? AppConstants.primaryColor
        : AppColors.surface(context);
    final fg = mine ? Colors.white : AppColors.textPrimary(context);

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 3),
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(16),
              topRight: const Radius.circular(16),
              bottomLeft: Radius.circular(mine ? 16 : 4),
              bottomRight: Radius.circular(mine ? 4 : 16),
            ),
            boxShadow: const [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 2,
                offset: Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                message.contenu,
                style: TextStyle(color: fg, fontSize: 15),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _formatTime(message.dateEnvoi),
                    style: TextStyle(
                      color: fg.withOpacity(0.7),
                      fontSize: 11,
                    ),
                  ),
                  if (mine) ...[
                    const SizedBox(width: 4),
                    Icon(
                      message.lu ? Icons.done_all : Icons.done,
                      size: 14,
                      color: message.lu
                          ? Colors.lightBlueAccent
                          : fg.withOpacity(0.7),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Séparateur de date ───────────────────────────────────────────────────
class _DateHeader extends StatelessWidget {
  final DateTime date;
  const _DateHeader({required this.date});

  String _label() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(date.year, date.month, date.day);
    final diff = today.difference(d).inDays;
    if (diff == 0) return "Aujourd'hui";
    if (diff == 1) return 'Hier';
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black12,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          _label(),
          style: const TextStyle(
            fontSize: 11,
            color: Colors.black54,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}