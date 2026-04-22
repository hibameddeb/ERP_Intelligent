import 'package:flutter/material.dart';
import '../../services/user_service.dart';
import '../../models/user.dart';
import '../../core/constants.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  final UserService _userService = UserService();
  late Future<List<User>> _clientsFuture;

  @override
  void initState() {
    super.initState();
    _clientsFuture = _userService.getMyClients();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Clients', style: TextStyle(color: AppConstants.textPrimary, fontWeight: FontWeight.bold)),
        backgroundColor: AppConstants.surfaceColor,
        elevation: 1,
      ),
      body: FutureBuilder<List<User>>(
        future: _clientsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('Aucun client assigné.'));
          }

          final clients = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: clients.length,
            itemBuilder: (context, index) {
              final client = clients[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                    child: Text(
                      client.prenom.isNotEmpty ? client.prenom[0].toUpperCase() : '?',
                      style: const TextStyle(color: AppConstants.primaryColor, fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(client.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(client.email),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: () {
                    // Show details or select for order
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
