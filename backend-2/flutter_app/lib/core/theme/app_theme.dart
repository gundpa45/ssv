import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// App-wide theme configuration using Material 3 with a premium dark theme.
class AppTheme {
  AppTheme._();

  // ─── Brand Colors ───────────────────────────────────────────────────
  static const Color _primaryColor = Color(0xFF5C7862); // Sage Green
  static const Color _secondaryColor = Color(0xFFFF735D); // Coral/Orange
  static const Color _errorColor = Color(0xFFCF6679);
  static const Color _surfaceColor = Color(0xFF262628); // Dark Grey Cards
  static const Color _scaffoldBg = Color(0xFF1A1A1C); // Very Dark Background

  static const Color _primaryLight = Color(0xFF4C6852); // Sage Green (Darker for Light Theme contrast)
  static const Color _surfaceLight = Colors.white; // White Cards
  static const Color _scaffoldBgLight = Color(0xFFF5F5F7); // Premium White Smoke Background
  static const Color _errorLight = Color(0xFFBA1A1A);

  // ─── Color Scheme ───────────────────────────────────────────────────
  static final ColorScheme _colorScheme = ColorScheme.fromSeed(
    seedColor: _primaryColor,
    secondary: _secondaryColor,
    error: _errorColor,
    surface: _surfaceColor,
    brightness: Brightness.dark,
  );

  static final ColorScheme _lightColorScheme = ColorScheme.fromSeed(
    seedColor: _primaryLight,
    secondary: _secondaryColor,
    error: _errorLight,
    surface: _surfaceLight,
    brightness: Brightness.light,
  );

  // ─── Theme Data ─────────────────────────────────────────────────────
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: _colorScheme,
      scaffoldBackgroundColor: _scaffoldBg,
      
      // Modern Typography using Inter
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        titleLarge: GoogleFonts.inter(fontWeight: FontWeight.w700),
        titleMedium: GoogleFonts.inter(fontWeight: FontWeight.w600),
        titleSmall: GoogleFonts.inter(fontWeight: FontWeight.w600),
        bodyLarge: GoogleFonts.inter(fontWeight: FontWeight.w400),
        bodyMedium: GoogleFonts.inter(fontWeight: FontWeight.w400),
      ),

      // ── AppBar (used sparingly now) ─────────────────────────────────
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
      ),

      // ── Card ────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        elevation: 0,
        margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        color: _surfaceColor,
        surfaceTintColor: Colors.transparent,
      ),

      // ── Input Decoration ────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _surfaceColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: _primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: _errorColor),
        ),
        hintStyle: TextStyle(
          color: Colors.grey.shade500,
          fontSize: 15,
        ),
        labelStyle: TextStyle(
          color: Colors.grey.shade400,
          fontSize: 15,
        ),
        prefixIconColor: Colors.grey.shade400,
      ),

      // ── Elevated Button ─────────────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
      ),

      // ── Navigation Bar (Bottom) ─────────────────────────────────────
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 70,
        backgroundColor: _scaffoldBg,
        indicatorColor: Colors.transparent,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysHide, // Hide labels like in the image
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: Colors.black, size: 26);
          }
          return IconThemeData(color: Colors.grey.shade500, size: 26);
        }),
      ),

      // ── Divider ─────────────────────────────────────────────────────
      dividerTheme: DividerThemeData(
        color: Colors.grey.shade800,
        thickness: 1,
        space: 1,
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: _lightColorScheme,
      scaffoldBackgroundColor: _scaffoldBgLight,
      cardColor: _surfaceLight,
      
      // Modern Typography using Inter
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).copyWith(
        titleLarge: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.black),
        titleMedium: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.black),
        titleSmall: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.black),
        bodyLarge: GoogleFonts.inter(fontWeight: FontWeight.w400, color: Colors.black87),
        bodyMedium: GoogleFonts.inter(fontWeight: FontWeight.w400, color: Colors.black87),
      ),

      // ── AppBar ──────────────────────────────────────────────────────
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
      ),

      // ── Card ────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        elevation: 0,
        margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        color: _surfaceLight,
        surfaceTintColor: Colors.transparent,
      ),

      // ── Input Decoration ────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _surfaceLight,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: _primaryLight, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: _errorLight),
        ),
        hintStyle: TextStyle(
          color: Colors.grey.shade500,
          fontSize: 15,
        ),
        labelStyle: TextStyle(
          color: Colors.grey.shade700,
          fontSize: 15,
        ),
        prefixIconColor: Colors.grey.shade600,
      ),

      // ── Elevated Button ─────────────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryLight,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),

      // ── Navigation Bar (Bottom) ─────────────────────────────────────
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 70,
        backgroundColor: _scaffoldBgLight,
        indicatorColor: Colors.transparent,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysHide,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: Colors.black, size: 26);
          }
          return IconThemeData(color: Colors.grey.shade400, size: 26);
        }),
      ),

      // ── Divider ─────────────────────────────────────────────────────
      dividerTheme: DividerThemeData(
        color: Colors.grey.shade300,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
