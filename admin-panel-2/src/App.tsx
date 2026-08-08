import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider, useApp } from './context/AppContext';
import { createAppTheme } from './theme';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AddUser } from './pages/AddUser';
import { UserManagement } from './pages/UserManagement';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { WorkMonitoring } from './pages/WorkMonitoring';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { WorkerProductivityReport } from './pages/WorkerProductivityReport';
import { Settings } from './pages/Settings';
import { UserProfile } from './pages/UserProfile';
import { SOManagement } from './pages/SOManagement';
import { SODashboard } from './pages/SODashboard';
import { DashboardLayout } from './components/DashboardLayout';

// Subcomponent to consume context state and apply dynamic themes
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode } = useApp();
  const theme = createAppTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

// Route protector for authorized pages
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Route protector for anonymous login
const AnonymousRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useApp();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AppProvider>
      <ThemeWrapper>
        <Router>
          <Routes>
            {/* Authenticated Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-user"
              element={
                <ProtectedRoute>
                  <AddUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-management"
              element={
                <ProtectedRoute>
                  <DepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/work-monitoring"
              element={
                <ProtectedRoute>
                  <WorkMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports-analytics"
              element={
                <ProtectedRoute>
                  <ReportsAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker-productivity"
              element={
                <ProtectedRoute>
                  <WorkerProductivityReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/so-management"
              element={
                <ProtectedRoute>
                  <SOManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/so-dashboard/:soNumber"
              element={
                <ProtectedRoute>
                  <SODashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/so-reports"
              element={
                <ProtectedRoute>
                  <SODashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/so-reports/:soNumber"
              element={
                <ProtectedRoute>
                  <SODashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/individual-employee-report"
              element={
                <ProtectedRoute>
                  <ReportsAnalytics defaultTab={1} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user-profile/:userId"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <AnonymousRoute>
                  <Login />
                </AnonymousRoute>
              }
            />

            {/* Default Catch-all Redirects */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeWrapper>
    </AppProvider>
  );
}

export default App;
