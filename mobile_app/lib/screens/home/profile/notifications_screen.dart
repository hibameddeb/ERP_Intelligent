import 'package:flutter/material.dart';
import '../../../core/constants.dart';
import '../../../core/app_colors.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _pushEnabled = true;
  bool _emailEnabled = true;
  bool _promoEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppColors.surface(context),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Gérer vos alertes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Notifications Push'),
                  subtitle: const Text('Alertes sur votre mobile'),
                  value: _pushEnabled,
                  activeThumbColor: AppConstants.primaryColor,
                  onChanged: (val) => setState(() => _pushEnabled = val),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Emails de service'),
                  subtitle: const Text('Mises à jour de commandes et sécurité'),
                  value: _emailEnabled,
                  activeThumbColor: AppConstants.primaryColor,
                  onChanged: (val) => setState(() => _emailEnabled = val),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Offres Promotionnelles'),
                  subtitle: const Text('Nouveautés et réductions'),
                  value: _promoEnabled,
                  activeThumbColor: AppConstants.primaryColor,
                  onChanged: (val) => setState(() => _promoEnabled = val),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
