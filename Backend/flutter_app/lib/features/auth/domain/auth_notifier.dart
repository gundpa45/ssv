import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../../app/config.dart';
import 'auth_state.dart';

/// Riverpod [StateNotifier] that manages authentication state.
///
/// **Rules followed:**
/// - Matches existing project pattern (StateNotifier + StateNotifierProvider).
/// - All business logic lives here (not in widgets).
/// - State is replaced immutably via [AuthState.copyWith].
/// - Does NOT perform navigation — only updates state.
/// - Does NOT depend on any existing notifier/provider.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _checkInitialAuth();
  }

  // ── Hive key constants ──────────────────────────────────────────────────
  static const String _keyToken = 'token';
  static const String _keyEmployeeId = 'employeeId';
  static const String _keyFirstName = 'firstName';
  static const String _keyLastName = 'lastName';
  static const String _keyRole = 'role';
  static const String _keyLoginTime = 'loginTime';

  // ── Backend base URL ────────────────────────────────────────────────────
  static const String _baseUrl = AppConfig.baseUrl;

  /// Dio instance for auth API calls.
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 45),
    receiveTimeout: const Duration(seconds: 45),
  ));

  // ── Task 3 — Auto-login restore ─────────────────────────────────────────

  /// Reads ALL persisted auth fields from Hive on app boot and restores state.
  void _checkInitialAuth() {
    try {
      final authBox = Hive.box('authBox');
      final token = authBox.get(_keyToken) as String?;

      if (token != null && token.isNotEmpty) {
        final employeeId = authBox.get(_keyEmployeeId) as String?;
        
        if (employeeId == 'EMP-123') {
          debugPrint('🧹 Found mock session (EMP-123). Clearing and forcing login screen...');
          logout();
          return;
        }

        final firstName = authBox.get(_keyFirstName) as String?;
        final lastName = authBox.get(_keyLastName) as String?;
        final role = authBox.get(_keyRole) as String?;
        final loginTimeMs = authBox.get(_keyLoginTime) as int?;
        final loginTime = loginTimeMs != null
            ? DateTime.fromMillisecondsSinceEpoch(loginTimeMs)
            : null;

        state = AuthState(
          isAuthenticated: true,
          token: token,
          employeeId: employeeId,
          firstName: firstName,
          lastName: lastName,
          role: role,
          loginTime: loginTime,
        );

        debugPrint(
          '🔑 Auto-login restored from Hive — '
          'employeeId: $employeeId, role: $role, loginTime: $loginTime',
        );
      }
    } catch (e) {
      debugPrint('⚠️ Error restoring auth from Hive: $e');
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Task 2 — Login (live API + mock fallback)
  // ────────────────────────────────────────────────────────────────────────

  /// Attempts login with [employeeId] and [password].
  ///
  /// 1. Sets loading state.
  /// 2. Calls real API at [_baseUrl]/auth/login.
  /// 3. On success: parses accessToken, employeeId, firstName, lastName, role.
  /// 4. Saves all five values to Hive authBox.
  /// 5. On any network / server failure: falls back to existing mock behavior.
  /// 6. Updates state — never navigates.
  Future<void> login(String employeeId, String password) async {
    // Clear previous error and set loading
    state = state.copyWith(
      isLoading: true,
      clearError: true,
    );

    try {
      // ── Live API call ─────────────────────────────────────────────────
      final response = await _dio.post(
        '$_baseUrl/auth/login',
        data: {
          'employeeId': employeeId,
          'password': password,
        },
      );

      final data = response.data as Map<String, dynamic>;

      final token = data['accessToken'] as String? ?? '';
      final returnedEmployeeId = data['employeeId'] as String? ?? employeeId;
      final firstName = data['firstName'] as String? ?? '';
      final lastName = data['lastName'] as String? ?? '';
      final role = data['role'] as String? ?? '';

      if (token.isNotEmpty) {
        debugPrint('🔍 [DEBUG] Login API token (first 50): ${token.length > 50 ? token.substring(0, 50) : token}');
      }

      if (token.isEmpty) {
        throw Exception('Server returned an empty token.');
      }

      await _saveAndAuthenticate(
        token: token,
        employeeId: returnedEmployeeId,
        firstName: firstName,
        lastName: lastName,
        role: role,
      );

      debugPrint(
        '✅ Live API login success — '
        'employeeId: $returnedEmployeeId, role: $role',
      );
    } on DioException catch (e) {
      // ── API-level error (4xx / 5xx) — show error, NO mock fallback ──
      if (e.response != null) {
        final statusCode = e.response!.statusCode ?? 0;
        final serverMessage = _extractServerError(e.response!.data);

        debugPrint(
          '❌ Login API returned $statusCode: $serverMessage',
        );

        if (!mounted) return;
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          errorMessage: serverMessage,
        );
        return;
      }

      // ── Network / timeout / unreachable — fallback to mock ──────────
      debugPrint(
        '⚠️ Auth API unreachable (${e.type.name}), using mock login fallback.',
      );
      await _mockLoginFallback(employeeId, password);
    } catch (e) {
      // ── Unexpected error — fallback to mock ──────────────────────────
      debugPrint('⚠️ Unexpected auth error, using mock login fallback: $e');
      await _mockLoginFallback(employeeId, password);
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Logout — Task 5 (clears ALL Hive keys)
  // ────────────────────────────────────────────────────────────────────────

  /// Clears ALL auth data from Hive and resets state.
  Future<void> logout() async {
    final authBox = Hive.box('authBox');
    await authBox.delete(_keyToken);
    await authBox.delete(_keyEmployeeId);
    await authBox.delete(_keyFirstName);
    await authBox.delete(_keyLastName);
    await authBox.delete(_keyRole);
    await authBox.delete(_keyLoginTime);

    state = const AuthState();

    debugPrint('🔒 User logged out — all Hive auth keys cleared.');
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers (private)
  // ────────────────────────────────────────────────────────────────────────

  /// Existing mock fallback — only triggered when the server is unreachable.
  ///
  /// Preserves Day 1–3 mock login behavior exactly.
  Future<void> _mockLoginFallback(String employeeId, String password) async {
    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    // Simulate a failure for 'invalid' credentials in mock mode
    if (employeeId.toLowerCase() == 'invalid' ||
        password.toLowerCase() == 'invalid') {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        errorMessage: 'Invalid Employee ID or password. Please try again.',
      );
      return;
    }

    // Determine mock role by employee ID
    final isAdminMock = employeeId.toLowerCase().contains('admin');
    final mockRole = isAdminMock ? 'Admin' : 'Worker';
    final mockToken = isAdminMock
        ? 'mock_admin_token_${DateTime.now().millisecondsSinceEpoch}'
        : 'mock_worker_token_${DateTime.now().millisecondsSinceEpoch}';

    await _saveAndAuthenticate(
      token: mockToken,
      employeeId: employeeId,
      firstName: isAdminMock ? 'Mock' : 'Mock',
      lastName: isAdminMock ? 'Admin' : 'Worker',
      role: mockRole,
    );

    debugPrint('🧪 Mock login success — employeeId: $employeeId, role: $mockRole');
  }

  /// Persists all auth fields into Hive and updates state to authenticated.
  Future<void> _saveAndAuthenticate({
    required String token,
    required String employeeId,
    required String firstName,
    required String lastName,
    required String role,
  }) async {
    final loginTime = DateTime.now();

    final authBox = Hive.box('authBox');
    await authBox.put(_keyToken, token);
    await authBox.put(_keyEmployeeId, employeeId);
    await authBox.put(_keyFirstName, firstName);
    await authBox.put(_keyLastName, lastName);
    await authBox.put(_keyRole, role);
    await authBox.put(_keyLoginTime, loginTime.millisecondsSinceEpoch);

    final savedToken = authBox.get(_keyToken) as String? ?? '';
    debugPrint('🔍 [DEBUG] Hive token (first 50): ${savedToken.length > 50 ? savedToken.substring(0, 50) : savedToken}');

    if (!mounted) return;

    state = state.copyWith(
      isLoading: false,
      isAuthenticated: true,
      token: token,
      employeeId: employeeId,
      firstName: firstName,
      lastName: lastName,
      role: role,
      loginTime: loginTime,
      clearError: true,
    );

    debugPrint(
      '💾 Auth saved to Hive — '
      'token: ${token.substring(0, token.length.clamp(0, 20))}...',
    );
  }

  /// Extracts a human-readable message from a server error response body.
  String _extractServerError(dynamic data) {
    if (data is Map<String, dynamic>) {
      return (data['message'] as String?) ??
          (data['error'] as String?) ??
          'Login failed. Please check your credentials.';
    }
    return 'Login failed. Please check your credentials.';
  }

  /// Clears any displayed error message.
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────

/// Global Riverpod provider for the Auth feature.
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);
