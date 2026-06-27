import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app/router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/domain/auth_notifier.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive for local storage (auth tokens, etc.)
  await Hive.initFlutter();
  await Hive.openBox('authBox');

  runApp(
    const ProviderScope(
      child: WorkforceApp(),
    ),
  );
}

/// Root widget for the Workforce Productivity Management System.
class WorkforceApp extends ConsumerWidget {
  const WorkforceApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp.router(
      title: 'Workforce Productivity',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
