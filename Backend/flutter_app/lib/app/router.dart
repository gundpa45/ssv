import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/admin/presentation/admin_dashboard_stub.dart';
import '../features/auth/domain/auth_notifier.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/daily_report/presentation/daily_report_screen.dart';
import '../features/history/presentation/history_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../shared/widgets/app_scaffold.dart';

import '../features/notifications/presentation/notifications_screen.dart';

/// Application route paths.
abstract class AppRoutes {
  static const String login = '/login';
  static const String dashboard = '/dashboard';
  static const String newActivity = '/new-activity';
  static const String history = '/history';
  static const String profile = '/profile';
  static const String admin = '/admin';
  static const String notifications = '/notifications';
}

/// GoRouter configuration provider.
///
/// It uses `ref.listen` to trigger a router refresh whenever the
/// `authProvider` state changes, ensuring secure redirection.
final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: AppRoutes.login,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuth = authState.isAuthenticated;
      final isAdmin = authState.role == 'Admin';
      final isGoingToLogin = state.uri.path == AppRoutes.login;

      // If user is not authenticated and trying to access a protected route
      if (!isAuth && !isGoingToLogin) {
        return AppRoutes.login;
      }
      
      // If user is authenticated
      if (isAuth) {
        if (isAdmin) {
          // Admin should only see the Admin screen
          if (state.uri.path != AppRoutes.admin) {
            return AppRoutes.admin;
          }
        } else {
          // Workers should not see Admin screen or Login screen
          if (state.uri.path == AppRoutes.admin || isGoingToLogin) {
            return AppRoutes.dashboard;
          }
        }
      }
      
      // No redirect needed
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.login,
        pageBuilder: (context, state) => const NoTransitionPage(
          child: LoginScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.admin,
        pageBuilder: (context, state) => const NoTransitionPage(
          child: AdminDashboardStub(),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) {
          return AppScaffold(
            currentPath: state.uri.path,
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: AppRoutes.dashboard,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.newActivity,
            pageBuilder: (context, state) => const MaterialPage(
              child: DailyReportScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.history,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HistoryScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.profile,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.notifications,
            pageBuilder: (context, state) => const MaterialPage(
              child: NotificationsScreen(),
            ),
          ),
        ],
      ),
    ],
  );

  // Trigger a router refresh whenever the authentication state changes
  ref.listen(authProvider, (_, __) {
    router.refresh();
  });

  return router;
});
