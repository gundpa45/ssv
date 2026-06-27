import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider, useApp } from './context/AppContext';
import { createAppTheme } from './theme';
import { Login } from './pages/Login';
import { WorkerLayout } from './components/WorkerLayout';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { SubmitWork } from './pages/worker/SubmitWork';
import { SubmissionHistory } from './pages/worker/SubmissionHistory';
import { WorkerNotifications } from './pages/worker/WorkerNotifications';

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createAppTheme('light');
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <WorkerLayout>{children}</WorkerLayout>;
};

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
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit-work"
              element={
                <ProtectedRoute>
                  <SubmitWork />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <SubmissionHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <WorkerNotifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/login"
              element={
                <AnonymousRoute>
                  <Login />
                </AnonymousRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeWrapper>
    </AppProvider>
  );
}

export default App;
