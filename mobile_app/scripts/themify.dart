// scripts/themify.dart  (V3 - extended patterns)
//
// Convertit toutes les couleurs hardcodees restantes en appels AppColors.
// Cible : les patterns que la V2 n'a pas attrapes.
//
// Usage : dart scripts/themify.dart

import 'dart:io';

void main() async {
  final libDir = Directory('lib/screens');
  if (!libDir.existsSync()) {
    print('Dossier lib/screens introuvable.');
    return;
  }

  // Patterns etendus (ordre = important).
  final replacements = <List<String>>[
    // ─── AppConstants ────────────────────────────────────────────────
    ['AppConstants.textPrimary', 'AppColors.textPrimary(context)'],
    ['AppConstants.textSecondary', 'AppColors.textSecondary(context)'],
    ['AppConstants.backgroundColor', 'AppColors.background(context)'],
    ['AppConstants.surfaceColor', 'AppColors.surface(context)'],

    // ─── Backgrounds clairs ──────────────────────────────────────────
    ['Color(0xFFF8F9FA)', 'AppColors.background(context)'],
    ['Color(0xFFF5F3FF)', 'AppColors.background(context)'],
    ['Color(0xFFF5F6FA)', 'AppColors.background(context)'],   // NEW
    ['Color(0xFFF9FAFB)', 'AppColors.inputFill(context)'],
    ['Color(0xFFF3F4F6)', 'AppColors.divider(context)'],

    // ─── Texte sombre (devient clair en dark) ────────────────────────
    ['Color(0xFF111827)', 'AppColors.textPrimary(context)'],   // NEW
    ['Color(0xFF1F2937)', 'AppColors.textPrimary(context)'],   // NEW
    ['Color(0xFF374151)', 'AppColors.textSecondary(context)'], // NEW
    ['Color(0xFF4B5563)', 'AppColors.textSecondary(context)'], // NEW
    ['Color(0xFF6B7280)', 'AppColors.textSecondary(context)'],
    ['Color(0xFF9CA3AF)', 'AppColors.textMuted(context)'],

    // ─── Bordures ────────────────────────────────────────────────────
    ['Color(0xFFE5E7EB)', 'AppColors.border(context)'],
    ['Color(0xFFD1D5DB)', 'AppColors.border(context)'],

    // ─── Bleu pale ───────────────────────────────────────────────────
    ['Color(0xFFDBEAFE)', 'AppColors.primaryLight(context)'],
    ['Color(0xFFEFF6FF)', 'AppColors.primaryPale(context)'],

    // ─── Rouge pale ──────────────────────────────────────────────────
    ['Color(0xFFFEF2F2)', 'AppColors.errorPale(context)'],
    ['Color(0xFFFECACA)', 'AppColors.errorBorder(context)'],
  ];

  final files = libDir
      .listSync(recursive: true)
      .whereType<File>()
      .where((f) => f.path.endsWith('.dart'))
      .toList();

  print('${files.length} fichiers .dart trouves');
  print('');

  int totalChanges = 0;
  int totalConstRemoved = 0;
  final filesChanged = <String>[];

  for (final file in files) {
    var content = file.readAsStringSync();
    final original = content;
    int fileChanges = 0;

    // 1. Remplacer les couleurs
    for (final r in replacements) {
      final count = r[0].allMatches(content).length;
      if (count > 0) {
        content = content.replaceAll(r[0], r[1]);
        fileChanges += count;
      }
    }

    if (content == original) continue;

    // 2. Retirer les `const` brises
    int constRemoved = 0;
    String previous;
    int pass = 0;
    do {
      previous = content;
      content = _removeBrokenConsts(content);
      if (content != previous) constRemoved++;
      pass++;
    } while (content != previous && pass < 100);
    totalConstRemoved += constRemoved;

    // 3. Ajouter l'import si absent
    if (!content.contains("app_colors.dart")) {
      final relativePath = file.path
          .replaceAll('\\', '/')
          .replaceFirst(RegExp(r'^lib/'), '');
      final depth = relativePath.split('/').length - 1;
      final importPath = '${'../' * depth}core/app_colors.dart';

      final lines = content.split('\n');
      int lastImportIdx = -1;
      for (int i = 0; i < lines.length; i++) {
        if (lines[i].trimLeft().startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      if (lastImportIdx >= 0) {
        lines.insert(lastImportIdx + 1, "import '$importPath';");
        content = lines.join('\n');
      }
    }

    file.writeAsStringSync(content);
    totalChanges += fileChanges;
    filesChanged.add('${file.path}  ($fileChanges colors, $constRemoved const)');
  }

  print('Fichiers modifies : ${filesChanged.length}');
  for (final f in filesChanged) {
    print('   - $f');
  }
  print('');
  print('Total : $totalChanges remplacements de couleurs.');
  print('Total : $totalConstRemoved retraits de const.');
}

String _removeBrokenConsts(String src) {
  int i = 0;
  while (i < src.length - 6) {
    final idx = src.indexOf('const ', i);
    if (idx < 0) break;
    final before = idx == 0 ? ' ' : src[idx - 1];
    if (RegExp(r'[a-zA-Z0-9_]').hasMatch(before)) { i = idx + 1; continue; }
    final exprStart = idx + 6;
    final exprEnd = _findExpressionEnd(src, exprStart);
    if (exprEnd > exprStart) {
      final expr = src.substring(exprStart, exprEnd);
      if (expr.contains('AppColors.') && expr.contains('(context)')) {
        return src.substring(0, idx) + src.substring(exprStart);
      }
    }
    i = idx + 1;
  }
  return src;
}

int _findExpressionEnd(String src, int start) {
  int i = start;
  while (i < src.length && (src[i] == ' ' || src[i] == '\n' || src[i] == '\t')) { i++; }
  while (i < src.length && RegExp(r'[a-zA-Z0-9_.<>]').hasMatch(src[i])) { i++; }
  while (i < src.length && (src[i] == ' ' || src[i] == '\n' || src[i] == '\t')) { i++; }
  if (i >= src.length) return i;
  if (src[i] != '(' && src[i] != '[' && src[i] != '{') return i;

  int parenDepth = 0, bracketDepth = 0, braceDepth = 0;
  bool inString = false;
  String stringChar = '';
  while (i < src.length) {
    final c = src[i];
    if (inString) {
      if (c == r'\' && i + 1 < src.length) { i += 2; continue; }
      if (c == stringChar) inString = false;
      i++;
      continue;
    }
    if (c == "'" || c == '"') { inString = true; stringChar = c; i++; continue; }
    if (c == '(') { parenDepth++; }
    else if (c == ')') { parenDepth--; }
    else if (c == '[') { bracketDepth++; }
    else if (c == ']') { bracketDepth--; }
    else if (c == '{') { braceDepth++; }
    else if (c == '}') { braceDepth--; }
    i++;
    if (parenDepth <= 0 && bracketDepth <= 0 && braceDepth <= 0) return i;
  }
  return i;
}