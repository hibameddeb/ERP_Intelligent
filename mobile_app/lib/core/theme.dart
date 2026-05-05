import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'constants.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: AppConstants.primaryColor,
      scaffoldBackgroundColor: AppConstants.backgroundColor,
      colorScheme: const ColorScheme.light(
        primary: AppConstants.primaryColor,
        secondary: AppConstants.secondaryColor,
        error: AppConstants.errorColor,
        surface: AppConstants.surfaceColor,
      ),
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.inter(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: AppConstants.textPrimary,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppConstants.textPrimary,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          color: AppConstants.textPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          color: AppConstants.textSecondary,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          elevation: 0,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppConstants.primaryColor,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppConstants.errorColor,
            width: 1,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: AppConstants.surfaceColor,
        elevation: 2,
        shadowColor: Colors.black.withOpacity(0.05),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: EdgeInsets.zero,
      ),
    );
  }

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: AppConstants.primaryColor,
    scaffoldBackgroundColor: const Color(0xFF0F172A),

    colorScheme: ColorScheme.dark(
      primary: AppConstants.primaryColor,
      surface: const Color(0xFF1E293B),
      error: AppConstants.errorColor,
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1E293B),
      foregroundColor: Color(0xFFF1F5F9),
      elevation: 0,
      iconTheme: IconThemeData(color: Color(0xFFF1F5F9)),
      titleTextStyle: TextStyle(
        color: Color(0xFFF1F5F9),
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    ),

    cardColor: const Color(0xFF1E293B),
    dividerColor: const Color(0xFF334155),

    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: Color(0xFFF1F5F9)),
      bodyMedium: TextStyle(color: Color(0xFFF1F5F9)),
      bodySmall: TextStyle(color: Color(0xFF94A3B8)),
      titleLarge: TextStyle(
        color: Color(0xFFF1F5F9),
        fontWeight: FontWeight.bold,
      ),
      titleMedium: TextStyle(
        color: Color(0xFFF1F5F9),
        fontWeight: FontWeight.w600,
      ),
    ),

    iconTheme: const IconThemeData(color: Color(0xFFF1F5F9)),

    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Color(0xFF1E293B),
      selectedItemColor: AppConstants.primaryColor,
      unselectedItemColor: Color(0xFF94A3B8),
    ),

    drawerTheme: const DrawerThemeData(backgroundColor: Color(0xFF1E293B)),

    cardTheme: const CardThemeData(color: Color(0xFF1E293B), elevation: 0),

    dialogTheme: const DialogThemeData(backgroundColor: Color(0xFF1E293B)),
  );
}
