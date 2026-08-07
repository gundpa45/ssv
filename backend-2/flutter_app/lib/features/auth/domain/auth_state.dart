/// Lightweight authentication state for the auth feature module.
///
/// Uses an immutable data class with [copyWith] for safe state transitions.
class AuthState {
  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.token,
    this.errorMessage,
    this.employeeId,
    this.firstName,
    this.lastName,
    this.role,
    this.loginTime,
  });

  /// Whether an auth request (login/logout) is in progress.
  final bool isLoading;

  /// Whether the user is currently authenticated.
  final bool isAuthenticated;

  /// JWT or session token received from the server.
  final String? token;

  /// Human-readable error message from the last failed attempt.
  final String? errorMessage;

  /// Employee ID returned by the server (e.g. "EMP001").
  final String? employeeId;

  /// First name returned by the server.
  final String? firstName;

  /// Last name returned by the server.
  final String? lastName;

  /// Role returned by the server (e.g. "Admin", "Worker").
  final String? role;

  /// Timestamp of when the user logged in.
  final DateTime? loginTime;

  // ── Convenience getters ─────────────────────────────────────────────────

  /// Full display name assembled from first + last name, or null if either missing.
  String? get fullName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    return firstName ?? lastName;
  }

  /// Whether the authenticated user holds the Admin role.
  bool get isAdmin => role == 'Admin';

  // ── copyWith ─────────────────────────────────────────────────────────────

  /// Creates a copy with the specified fields overridden.
  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    String? token,
    String? errorMessage,
    String? employeeId,
    String? firstName,
    String? lastName,
    String? role,
    DateTime? loginTime,
    bool clearError = false,
    bool clearToken = false,
    bool clearUserData = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      token: clearToken ? null : (token ?? this.token),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      employeeId: clearUserData ? null : (employeeId ?? this.employeeId),
      firstName: clearUserData ? null : (firstName ?? this.firstName),
      lastName: clearUserData ? null : (lastName ?? this.lastName),
      role: clearUserData ? null : (role ?? this.role),
      loginTime: clearUserData ? null : (loginTime ?? this.loginTime),
    );
  }

  // ── Equality / hashCode ──────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthState &&
          runtimeType == other.runtimeType &&
          isLoading == other.isLoading &&
          isAuthenticated == other.isAuthenticated &&
          token == other.token &&
          errorMessage == other.errorMessage &&
          employeeId == other.employeeId &&
          firstName == other.firstName &&
          lastName == other.lastName &&
          role == other.role &&
          loginTime == other.loginTime;

  @override
  int get hashCode => Object.hash(
        isLoading,
        isAuthenticated,
        token,
        errorMessage,
        employeeId,
        firstName,
        lastName,
        role,
        loginTime,
      );

  @override
  String toString() =>
      'AuthState(isLoading: $isLoading, isAuthenticated: $isAuthenticated, '
      'token: ${token != null ? "***" : "null"}, errorMessage: $errorMessage, '
      'employeeId: $employeeId, firstName: $firstName, lastName: $lastName, role: $role, loginTime: $loginTime)';
}
