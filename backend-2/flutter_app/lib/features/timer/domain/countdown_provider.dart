import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/auth_notifier.dart';

class CountdownState {
  const CountdownState({
    this.isActive = false,
    this.remainingDuration = Duration.zero,
  });

  final bool isActive;
  final Duration remainingDuration;

  CountdownState copyWith({
    bool? isActive,
    Duration? remainingDuration,
  }) {
    return CountdownState(
      isActive: isActive ?? this.isActive,
      remainingDuration: remainingDuration ?? this.remainingDuration,
    );
  }
}

class CountdownNotifier extends Notifier<CountdownState> {
  Timer? _timer;
  bool _isDisposed = false;

  // The constants for the countdown
  static const _delayBeforeStart = Duration(minutes: 15);
  static const _shiftDuration = Duration(hours: 8);

  @override
  CountdownState build() {
    _isDisposed = false;
    
    ref.onDispose(() {
      _isDisposed = true;
      _timer?.cancel();
      _timer = null;
    });

    // Listen to authentication state changes to start/stop the timer
    ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated && next.loginTime != null) {
        _startTimer(next.loginTime!);
      } else {
        _stopTimer();
      }
    });

    // If already authenticated upon initial build, start it
    final currentAuth = ref.read(authProvider);
    if (currentAuth.isAuthenticated && currentAuth.loginTime != null) {
      Future.microtask(() => _startTimer(currentAuth.loginTime!));
      return _calculateInitialState(currentAuth.loginTime!);
    }

    return const CountdownState();
  }

  CountdownState _calculateInitialState(DateTime loginTime) {
    final now = DateTime.now();
    final timePassedSinceLogin = now.difference(loginTime);

    if (timePassedSinceLogin < _delayBeforeStart) {
      return const CountdownState(isActive: false);
    }

    final timePassedSinceShiftStart = timePassedSinceLogin - _delayBeforeStart;
    var remaining = _shiftDuration - timePassedSinceShiftStart;
    if (remaining.isNegative) {
      remaining = Duration.zero;
    }

    return CountdownState(
      isActive: true,
      remainingDuration: remaining,
    );
  }

  void _startTimer(DateTime loginTime) {
    if (_isDisposed) return;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _evaluateTimer(loginTime);
    });
    _evaluateTimer(loginTime); // Initial evaluation
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
    if (!_isDisposed) {
      state = const CountdownState(); // Reset
    }
  }

  void _evaluateTimer(DateTime loginTime) {
    final now = DateTime.now();
    final timePassedSinceLogin = now.difference(loginTime);

    // If we haven't reached the 15-minute mark yet
    if (timePassedSinceLogin < _delayBeforeStart) {
      if (state.isActive) {
        state = state.copyWith(isActive: false);
      }
      return;
    }

    // Time passed since the 8-hour shift officially started
    final timePassedSinceShiftStart = timePassedSinceLogin - _delayBeforeStart;

    // Remaining time
    var remaining = _shiftDuration - timePassedSinceShiftStart;
    if (remaining.isNegative) {
      remaining = Duration.zero; // Shift ended
    }

    state = state.copyWith(
      isActive: true,
      remainingDuration: remaining,
    );
  }
}

final countdownProvider = NotifierProvider<CountdownNotifier, CountdownState>(() {
  return CountdownNotifier();
});
