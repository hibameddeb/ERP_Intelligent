// lib/core/app_colors.dart
//
// Couleurs adaptatives selon le thème courant (clair / sombre).
// À utiliser PARTOUT à la place de Colors.white, Color(0xFFF8F9FA), etc.

import 'package:flutter/material.dart';
import 'constants.dart';

class AppColors {
  static bool _isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  // ─── Backgrounds ──────────────────────────────────────────────────
  /// Fond principal de l'écran (Scaffold)
  static Color background(BuildContext context) =>
      _isDark(context) ? const Color(0xFF0F172A) : const Color(0xFFF8F9FA);

  /// Surfaces : cards, AppBar, modales
  static Color surface(BuildContext context) =>
      _isDark(context) ? const Color(0xFF1E293B) : Colors.white;

  /// Surface secondaire (un peu plus claire/sombre que surface)
  static Color surfaceVariant(BuildContext context) =>
      _isDark(context) ? const Color(0xFF334155) : const Color(0xFFF3F4F6);

  /// Fond des champs de saisie / input
  static Color inputFill(BuildContext context) =>
      _isDark(context) ? const Color(0xFF111827) : const Color(0xFFF9FAFB);

  // ─── Texte ────────────────────────────────────────────────────────
  static Color textPrimary(BuildContext context) =>
      _isDark(context) ? const Color(0xFFF1F5F9) : AppConstants.textPrimary;

  static Color textSecondary(BuildContext context) =>
      _isDark(context) ? const Color(0xFF94A3B8) : AppConstants.textSecondary;

  static Color textMuted(BuildContext context) =>
      _isDark(context) ? const Color(0xFF64748B) : const Color(0xFF9CA3AF);

  // ─── Bordures et séparateurs ─────────────────────────────────────
  static Color border(BuildContext context) =>
      _isDark(context) ? const Color(0xFF334155) : const Color(0xFFE5E7EB);

  static Color divider(BuildContext context) =>
      _isDark(context) ? const Color(0xFF334155) : const Color(0xFFF3F4F6);

  // ─── Couleurs accentuées (pâles) ─────────────────────────────────
  /// Bleu très pâle (fond des badges, icônes)
  static Color primaryPale(BuildContext context) => _isDark(context)
      ? AppConstants.primaryColor.withValues(alpha: 0.18)
      : const Color(0xFFEFF6FF);

  /// Bleu clair (fond des chips "Compte vérifié")
  static Color primaryLight(BuildContext context) => _isDark(context)
      ? AppConstants.primaryColor.withValues(alpha: 0.25)
      : const Color(0xFFDBEAFE);

  /// Rouge pâle (boutons logout, erreurs)
  static Color errorPale(BuildContext context) => _isDark(context)
      ? const Color(0xFF7F1D1D).withValues(alpha: 0.3)
      : const Color(0xFFFEF2F2);

  /// Bordure rouge claire
  static Color errorBorder(BuildContext context) => _isDark(context)
      ? const Color(0xFF7F1D1D)
      : const Color(0xFFFECACA);

  // ─── Ombres ──────────────────────────────────────────────────────
  static Color shadow(BuildContext context) => _isDark(context)
      ? Colors.black.withValues(alpha: 0.3)
      : Colors.black.withValues(alpha: 0.05);
}