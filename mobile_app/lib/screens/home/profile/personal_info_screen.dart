import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../core/constants.dart';
import '../../../core/app_colors.dart';
class PersonalInfoScreen extends StatefulWidget {
  const PersonalInfoScreen({super.key});

  @override
  State<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends State<PersonalInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nomController;
  late TextEditingController _prenomController;
  late TextEditingController _numTlpController;
  
  // Client specific fields
  late TextEditingController _adresseController;
  late TextEditingController _villeController;
  late TextEditingController _rueController;
  late TextEditingController _activiteController;

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().currentUser;
    _nomController = TextEditingController(text: user?.nom ?? '');
    _prenomController = TextEditingController(text: user?.prenom ?? '');
    _numTlpController = TextEditingController(text: user?.numTlp ?? '');
    
    // We only have ville and activite in the current User model. 
    // Address and rue might not be fully mapped, but we can send them.
    _adresseController = TextEditingController(text: '');
    _villeController = TextEditingController(text: user?.ville ?? '');
    _rueController = TextEditingController(text: '');
    _activiteController = TextEditingController(text: user?.activite ?? '');
  }

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _numTlpController.dispose();
    _adresseController.dispose();
    _villeController.dispose();
    _rueController.dispose();
    _activiteController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      final user = context.read<AuthProvider>().currentUser;
      final data = {
        'nom': _nomController.text.trim(),
        'prenom': _prenomController.text.trim(),
        'num_tlp': _numTlpController.text.trim(),
      };
      
      if (user?.role == 'client') {
        data['adresse'] = _adresseController.text.trim();
        data['ville'] = _villeController.text.trim();
        data['rue'] = _rueController.text.trim();
        data['activite'] = _activiteController.text.trim();
      }

      await context.read<AuthProvider>().updateProfile(data);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profil mis à jour avec succès')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().currentUser;
    final isClient = user?.role == 'client';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Informations Personnelles'),
        backgroundColor: AppColors.surface(context),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildTextField('Prénom', _prenomController, true),
              const SizedBox(height: 16),
              _buildTextField('Nom', _nomController, true),
              const SizedBox(height: 16),
              _buildTextField('Téléphone', _numTlpController, false),
              
              if (isClient) ...[
                const SizedBox(height: 24),
                const Text('Informations Entreprise', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _buildTextField('Activité', _activiteController, false),
                const SizedBox(height: 16),
                _buildTextField('Ville', _villeController, false),
                const SizedBox(height: 16),
                _buildTextField('Adresse', _adresseController, false),
                const SizedBox(height: 16),
                _buildTextField('Rue', _rueController, false),
              ],
              
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isSaving ? null : _saveProfile,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: AppConstants.primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSaving 
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Enregistrer les modifications', style: TextStyle(fontSize: 16, color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, bool isRequired) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
        fillColor: Colors.white,
      ),
      validator: isRequired 
          ? (value) => value == null || value.trim().isEmpty ? 'Ce champ est requis' : null
          : null,
    );
  }
}
