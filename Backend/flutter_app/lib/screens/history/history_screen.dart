import 'package:flutter/material.dart';
import '../../features/history/presentation/history_screen.dart' as real;

/// Wrapper around the real HistoryScreen from the features package.
/// This ensures backward compatibility and solves any caching/routing anomalies.
class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const real.HistoryScreen();
  }
}
