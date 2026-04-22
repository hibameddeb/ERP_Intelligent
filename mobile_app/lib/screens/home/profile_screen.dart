import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil', style: TextStyle(color: AppConstants.textPrimary, fontWeight: FontWeight.bold)),
        backgroundColor: AppConstants.surfaceColor,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppConstants.errorColor),
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
      body: user == null 
        ? const Center(child: Text('Erreur de chargement du profil'))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: AppConstants.primaryColor.withOpacity(0.1),
                  child: Text(
                    user.prenom.isNotEmpty ? user.prenom[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 40, color: AppConstants.primaryColor, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 16),
                Text(user.fullName, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(color: AppConstants.secondaryColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text(user.role.toUpperCase(), style: const TextStyle(color: AppConstants.secondaryColor, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
                const SizedBox(height: 32),
                _buildInfoTile(Icons.email_outlined, 'Email', user.email),
                _buildInfoTile(Icons.phone_outlined, 'Téléphone', user.numTlp ?? 'Non renseigné'),
              ],
            ),
          ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        leading: Icon(icon, color: AppConstants.primaryColor),
        title: Text(label, style: const TextStyle(color: AppConstants.textSecondary, fontSize: 12)),
        subtitle: Text(value, style: const TextStyle(color: AppConstants.textPrimary, fontSize: 16, fontWeight: FontWeight.w500)),
      ),
    );
  }
}
