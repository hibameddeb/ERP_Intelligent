// lib/providers/theme_provider.dart
//
// Gère le mode clair / sombre de toute l'application.
// - Persiste le choix dans SharedPreferences (clé 'dark_mode')
// - Notifie tous les widgets qui écoutent (via Provider) quand on change
// - Par défaut : mode clair (Light)

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider extends ChangeNotifier {
  static const String _prefsKey = 'dark_mode';

  bool _isDarkMode = false;
  bool get isDarkMode => _isDarkMode;

  ThemeMode get themeMode => _isDarkMode ? ThemeMode.dark : ThemeMode.light;

  ThemeProvider() {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _isDarkMode = prefs.getBool(_prefsKey) ?? false; // light par défaut
      notifyListeners();
    } catch (_) {
      _isDarkMode = false;
    }
  }

  Future<void> toggleTheme() async {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefsKey, _isDarkMode);
    } catch (_) {}
  }

  Future<void> setDarkMode(bool value) async {
    if (_isDarkMode == value) return;
    _isDarkMode = value;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefsKey, _isDarkMode);
    } catch (_) {}
  }
}