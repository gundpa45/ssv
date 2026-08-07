import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/router.dart';
import '../../features/timer/domain/countdown_provider.dart';

/// Persistent scaffold wrapper used by the ShellRoute.
///
/// Provides a bottom navigation with a custom dark theme design,
/// and an optional global countdown banner at the top.
class AppScaffold extends ConsumerWidget {
  const AppScaffold({
    super.key,
    required this.child,
    required this.currentPath,
  });

  /// The page body injected by the ShellRoute.
  final Widget child;

  /// The current URI path, used to determine the active tab index.
  final String currentPath;

  // ─── Tab Definitions ──────────────────────────────────────────────
  static const List<_TabItem> _tabs = [
    _TabItem(
      path: AppRoutes.dashboard, // Updated to dashboard
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_filled,
      label: 'Home',
    ),
    _TabItem(
      path: AppRoutes.history,
      icon: Icons.history_outlined,
      selectedIcon: Icons.history,
      label: 'History',
    ),
    _TabItem(
      path: AppRoutes.profile,
      icon: Icons.person_outline,
      selectedIcon: Icons.person,
      label: 'Profile',
    ),
  ];

  /// Determines the selected tab index from the current route path.
  int _selectedIndex() {
    for (int i = 0; i < _tabs.length; i++) {
      if (currentPath == _tabs[i].path || 
          (currentPath == AppRoutes.newActivity && i == 0)) {
        return i;
      }
    }
    return 0; // Default to Home
  }

  /// Formats duration into HH:MM:SS
  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = _selectedIndex();
    final theme = Theme.of(context);
    final countdownState = ref.watch(countdownProvider);

    return Scaffold(
      body: Column(
        children: [
          // ── Global Countdown Banner ──────────────────────────────
          if (countdownState.isActive)
            Container(
              color: const Color(0xFFC62828).withOpacity(0.9), // Deep Red
              width: double.infinity,
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 8,
                bottom: 12,
              ),
              child: Column(
                children: [
                  const Text(
                    'SHIFT ENDS IN',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatDuration(countdownState.remainingDuration),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
          
          // ── Main Content ──────────────────────────────────────────
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          height: 80,
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final w = constraints.maxWidth;
              final h = constraints.maxHeight;

              // Grid positioning for 3 slots:
              // Home centered at 1/6 of width
              // History centered at 1/2 of width
              // Profile/Notch centered at 5/6 of width
              final cx0 = w / 6;
              final cx1 = w / 2;
              final cx2 = 5 * w / 6;

              final selectedIndex = _selectedIndex();

              return Stack(
                clipBehavior: Clip.none,
                children: [
                  // 1. Custom notched background painter
                  Positioned.fill(
                    child: CustomPaint(
                      painter: NotchedTabBarPainter(
                        notchCenter: cx2,
                        notchCenterY: 34.0, // Centered vertically to fit button inside
                        notchRadius: 36.0,
                        color: Colors.black, // Sleek black bar container
                      ),
                    ),
                  ),

                  // 2. Tab Items Row (Home and History)
                  Positioned.fill(
                    child: Row(
                      children: [
                        // Tab 0: Home
                        Expanded(
                          child: AnimatedIconTab(
                            isSelected: selectedIndex == 0,
                            icon: _tabs[0].icon,
                            selectedIcon: _tabs[0].selectedIcon,
                            activeColor: const Color(0xFFFF735D), // Original brand color (Coral)
                            onTap: () {
                              if (_tabs[0].path != currentPath) {
                                context.go(_tabs[0].path);
                              }
                            },
                          ),
                        ),

                        // Tab 1: History
                        Expanded(
                          child: AnimatedIconTab(
                            isSelected: selectedIndex == 1,
                            icon: _tabs[1].icon,
                            selectedIcon: _tabs[1].selectedIcon,
                            activeColor: const Color(0xFFFF735D), // Original brand color (Coral)
                            onTap: () {
                              if (_tabs[1].path != currentPath) {
                                context.go(_tabs[1].path);
                              }
                            },
                          ),
                        ),

                        // Spacer placeholder for the Profile tab (which floats inside the notch)
                        const Expanded(
                          child: SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),

                  // 3. Animated Profile Button centered inside the notch (completely within the footer)
                  Positioned(
                    left: cx2 - 28, // Centered at cx2 (diameter is 56)
                    top: 12, // Perfectly centered vertically inside the 80px container (no vertical overflow)
                    width: 56,
                    height: 56,
                    child: AnimatedFloatingButton(
                      isSelected: selectedIndex == 2,
                      icon: _tabs[2].icon,
                      selectedIcon: _tabs[2].selectedIcon,
                      activeColor: const Color(0xFFFF735D), // Original brand color (Coral)
                      onTap: () {
                        if (_tabs[2].path != currentPath) {
                          context.go(_tabs[2].path);
                        }
                      },
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Custom widget for Home and History tabs with springy scale bounce animations.
class AnimatedIconTab extends StatefulWidget {
  const AnimatedIconTab({
    super.key,
    required this.isSelected,
    required this.icon,
    required this.selectedIcon,
    required this.onTap,
    required this.activeColor,
    this.inactiveColor = const Color(0xFF9E9E9E),
  });

  final bool isSelected;
  final IconData icon;
  final IconData selectedIcon;
  final VoidCallback onTap;
  final Color activeColor;
  final Color inactiveColor;

  @override
  State<AnimatedIconTab> createState() => _AnimatedIconTabState();
}

class _AnimatedIconTabState extends State<AnimatedIconTab> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.2)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 50,
      ),
    ]).animate(_controller);

    if (widget.isSelected) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(covariant AnimatedIconTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        widget.onTap();
        _controller.forward(from: 0.0);
      },
      behavior: HitTestBehavior.opaque,
      child: Center(
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.isSelected
                  ? widget.activeColor
                  : Colors.transparent,
            ),
            child: Icon(
              widget.isSelected ? widget.selectedIcon : widget.icon,
              color: widget.isSelected ? Colors.black : widget.inactiveColor,
              size: 26,
            ),
          ),
        ),
      ),
    );
  }
}

/// Custom floating action button inside the notch with springy scale bounce animations.
class AnimatedFloatingButton extends StatefulWidget {
  const AnimatedFloatingButton({
    super.key,
    required this.isSelected,
    required this.icon,
    required this.selectedIcon,
    required this.onTap,
    required this.activeColor,
    this.inactiveColor = Colors.white,
  });

  final bool isSelected;
  final IconData icon;
  final IconData selectedIcon;
  final VoidCallback onTap;
  final Color activeColor;
  final Color inactiveColor;

  @override
  State<AnimatedFloatingButton> createState() => _AnimatedFloatingButtonState();
}

class _AnimatedFloatingButtonState extends State<AnimatedFloatingButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.2)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 50,
      ),
    ]).animate(_controller);

    if (widget.isSelected) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(covariant AnimatedFloatingButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: GestureDetector(
        onTap: () {
          widget.onTap();
          _controller.forward(from: 0.0);
        },
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black, // Dark container matching the bar
            shape: BoxShape.circle,
            border: Border.all(
              color: widget.isSelected ? widget.activeColor : Colors.transparent,
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: widget.isSelected
                    ? widget.activeColor.withOpacity(0.3)
                    : Colors.black.withOpacity(0.25),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Icon(
              widget.isSelected ? widget.selectedIcon : widget.icon,
              color: widget.isSelected ? widget.activeColor : widget.inactiveColor.withOpacity(0.9),
              size: 26,
            ),
          ),
        ),
      ),
    );
  }
}

/// Custom painter to draw the notched pill-shaped bottom bar.
class NotchedTabBarPainter extends CustomPainter {
  NotchedTabBarPainter({
    required this.notchCenter,
    required this.notchCenterY,
    required this.notchRadius,
    required this.color,
  });

  final double notchCenter;
  final double notchCenterY;
  final double notchRadius;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path();
    final w = size.width;
    final h = size.height;
    const r = 36.0; // Corner radius matching premium pill shape

    path.moveTo(r, 0);

    final cx = notchCenter;
    final cy = notchCenterY;
    final nStart = cx - notchRadius - 12;
    final nEnd = cx + notchRadius + 12;

    path.lineTo(nStart, 0);

    // Deep smooth wave/notch curves dipping to cy + notchRadius
    path.cubicTo(
      cx - notchRadius, 0,
      cx - notchRadius, cy + notchRadius * 0.95,
      cx, cy + notchRadius * 0.95,
    );
    path.cubicTo(
      cx + notchRadius, cy + notchRadius * 0.95,
      cx + notchRadius, 0,
      nEnd, 0,
    );

    path.lineTo(w - r, 0);
    path.arcToPoint(Offset(w, r), radius: const Radius.circular(r), clockwise: true);
    path.lineTo(w, h - r);
    path.arcToPoint(Offset(w - r, h), radius: const Radius.circular(r), clockwise: true);
    path.lineTo(r, h);
    path.arcToPoint(Offset(0, h - r), radius: const Radius.circular(r), clockwise: true);
    path.lineTo(0, r);
    path.arcToPoint(const Offset(r, 0), radius: const Radius.circular(r), clockwise: true);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant NotchedTabBarPainter oldDelegate) {
    return oldDelegate.notchCenter != notchCenter ||
        oldDelegate.notchCenterY != notchCenterY ||
        oldDelegate.notchRadius != notchRadius ||
        oldDelegate.color != color;
  }
}

/// Internal data class for tab configuration.
class _TabItem {
  const _TabItem({
    required this.path,
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}
