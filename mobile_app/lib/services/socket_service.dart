// lib/services/socket_service.dart
//
// Singleton Socket.io. Lit le token sous la clé 'jwt_token' (celle utilisée
// par auth_service.dart au login).

import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;
  IO.Socket? get socket => _socket;

  /// URL du serveur Socket.io = base de l'API SANS le suffixe `/api`.
  String get _serverUrl =>
      AppConstants.apiBaseUrl.replaceAll(RegExp(r'/api/?$'), '');

  /// Initialise et connecte le socket. À appeler après login.
  Future<void> connect() async {
    if (_socket != null && _socket!.connected) return;

    final prefs = await SharedPreferences.getInstance();
    // ⚠️ La clé est 'jwt_token' (cf. auth_service.dart)
    final token = prefs.getString('jwt_token') ?? '';
    if (token.isEmpty) {
      // ignore: avoid_print
      print('[SOCKET] Pas de token, connexion annulée.');
      return;
    }

    _socket = IO.io(
      _serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableReconnection()
          .setReconnectionAttempts(9999)
          .setReconnectionDelay(1000)
          .disableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      // ignore: avoid_print
      print('[SOCKET] Connecté ✅');
    });
    _socket!.onDisconnect((reason) {
      // ignore: avoid_print
      print('[SOCKET] Déconnecté: $reason');
    });
    _socket!.onConnectError((err) {
      // ignore: avoid_print
      print('[SOCKET] Erreur de connexion: $err');
    });
    _socket!.onError((err) {
      // ignore: avoid_print
      print('[SOCKET] Erreur: $err');
    });

    _socket!.connect();
  }

  /// Déconnecte (à appeler au logout).
  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }

  // ─── Émission ───────────────────────────────────────────────────────────
  void emitTypingStart(int toUserId) {
    _socket?.emit('typing:start', {'to': toUserId});
  }

  void emitTypingStop(int toUserId) {
    _socket?.emit('typing:stop', {'to': toUserId});
  }

  void emitMessageRead(int fromUserId) {
    _socket?.emit('message:read', {'from': fromUserId});
  }

  // ─── Helpers de souscription (renvoie la fonction de désinscription) ────
  void Function() onMessageNew(void Function(dynamic data) handler) {
    _socket?.on('message:new', handler);
    return () => _socket?.off('message:new', handler);
  }

  void Function() onMessageRead(void Function(dynamic data) handler) {
    _socket?.on('message:read', handler);
    return () => _socket?.off('message:read', handler);
  }

  void Function() onTypingStart(void Function(dynamic data) handler) {
    _socket?.on('typing:start', handler);
    return () => _socket?.off('typing:start', handler);
  }

  void Function() onTypingStop(void Function(dynamic data) handler) {
    _socket?.on('typing:stop', handler);
    return () => _socket?.off('typing:stop', handler);
  }
}