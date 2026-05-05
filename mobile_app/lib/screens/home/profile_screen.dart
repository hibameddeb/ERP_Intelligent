import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants.dart';
import '../../core/app_colors.dart';
import '../auth/login_screen.dart';
import 'profile/personal_info_screen.dart';
import 'profile/security_screen.dart';
import 'profile/settings_screen.dart';
import 'profile/notifications_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Erreur de chargement du profil')),
      );
    }

    final roleLabel = user.activite?.isNotEmpty == true
        ? user.activite!
        : (user.role == 'client' ? 'Client' : 'Commercial');

    return Scaffold(
      backgroundColor: AppColors.background(context), // 🌗
      appBar: AppBar(
        backgroundColor: AppColors.background(context), // 🌗
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 8.0, bottom: 8.0),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface(context), // 🌗
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: AppColors.shadow(context), blurRadius: 4), // 🌗
              ],
            ),
            child: Icon(
              Icons.business,
              size: 18,
              color: AppColors.textPrimary(context), // 🌗
            ),
          ),
        ),
        title: const Text(
          'Profil',
          style: TextStyle(
            color: AppConstants.primaryColor,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(Icons.search, color: AppColors.textPrimary(context)), // 🌗
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Recherche non disponible dans le profil'),
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // --- HEADER ---
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface(context), // 🌗
                    shape: BoxShape.circle,
                  ),
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor:
                        AppConstants.primaryColor.withValues(alpha: 0.1),
                    child: user.avatar != null && user.avatar!.isNotEmpty
                        ? ClipOval(
                            child: Image.network(
                              user.avatar!,
                              fit: BoxFit.cover,
                              width: 100,
                              height: 100,
                            ),
                          )
                        : Text(
                            user.fullName.isNotEmpty
                                ? user.fullName[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              fontSize: 36,
                              color: AppConstants.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
                GestureDetector(
                  onTap: () async {
                    final picker = ImagePicker();
                    final pickedFile =
                        await picker.pickImage(source: ImageSource.gallery);
                    if (pickedFile != null && context.mounted) {
                      try {
                        await context
                            .read<AuthProvider>()
                            .uploadAvatar(pickedFile.path);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Avatar mis à jour avec succès'),
                            ),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Erreur: ${e.toString()}'),
                            ),
                          );
                        }
                      }
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 2, right: 2),
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppConstants.primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child:
                        const Icon(Icons.edit, color: Colors.white, size: 16),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              user.fullName,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary(context), // 🌗
              ),
            ),
            const SizedBox(height: 4),
            Text(
              roleLabel,
              style: TextStyle(
                fontSize: 15,
                color: AppColors.textSecondary(context), // 🌗
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primaryLight(context), // 🌗
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified_outlined,
                      size: 16, color: AppConstants.primaryColor),
                  SizedBox(width: 6),
                  Text(
                    'Compte Vérifié B2B',
                    style: TextStyle(
                      color: AppConstants.primaryColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // --- MENU SECTIONS ---
            _buildSectionHeader(context, 'COMPTE'),
            _buildCardGroup(context, [
              _buildMenuItem(
                context: context,
                icon: Icons.person_outline,
                title: 'Informations Personnelles',
                subtitle: 'Gérez votre identité et vos accès',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const PersonalInfoScreen(),
                    ),
                  );
                },
                showDivider: true,
              ),
              _buildMenuItem(
                context: context,
                icon: Icons.settings_outlined,
                title: 'Paramètres',
                subtitle: "Préférences d'interface et langue",
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const SettingsScreen(),
                    ),
                  );
                },
                showDivider: false,
              ),
            ]),

            const SizedBox(height: 24),

            _buildSectionHeader(context, 'SÉCURITÉ & ALERTES'),
            _buildCardGroup(context, [
              _buildMenuItem(
                context: context,
                icon: Icons.notifications_none,
                title: 'Notifications',
                subtitle: 'Configurées sur Mobile & Email',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const NotificationsScreen(),
                    ),
                  );
                },
                showDivider: true,
              ),
              _buildMenuItem(
                context: context,
                icon: Icons.security_outlined,
                title: 'Sécurité',
                subtitle: '2FA activé, mot de passe à jour',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const SecurityScreen(),
                    ),
                  );
                },
                showDivider: false,
              ),
            ]),

            const SizedBox(height: 32),

            // --- LOGOUT BUTTON ---
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: () async {
                  await context.read<AuthProvider>().logout();
                  if (context.mounted) {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const LoginScreen(),
                      ),
                      (route) => false,
                    );
                  }
                },
                icon: const Icon(Icons.logout,
                    color: AppConstants.errorColor),
                label: const Text(
                  'Déconnexion',
                  style: TextStyle(
                    color: AppConstants.errorColor,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.errorPale(context), // 🌗
                  elevation: 0,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: AppColors.errorBorder(context), // 🌗
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),
            Text(
              'ERP Commercial • v1.0.0',
              style: TextStyle(
                color: AppColors.textSecondary(context), // 🌗
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 12),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: TextStyle(
            color: AppColors.textSecondary(context), // 🌗
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildCardGroup(BuildContext context, List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface(context), // 🌗
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow(context), // 🌗
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildMenuItem({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool showDivider = false,
  }) {
    return Column(
      children: [
        ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primaryPale(context), // 🌗
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppConstants.primaryColor, size: 22),
          ),
          title: Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary(context), 
              fontSize: 15,
            ),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4.0),
            child: Text(
              subtitle,
              style: TextStyle(
                color: AppColors.textSecondary(context), 
                fontSize: 13,
              ),
            ),
          ),
          trailing: Icon(
            Icons.chevron_right,
            color: AppColors.textMuted(context), 
          ),
          onTap: onTap,
        ),
        if (showDivider)
          Divider(
            height: 1,
            thickness: 1,
            indent: 64,
            color: AppColors.divider(context), 
          ),
      ],
    );
  }
}