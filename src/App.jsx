import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HealthProvider, useHealth } from './context/HealthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import InputForm from './components/InputForm';
import Login from './pages/Login';
import VerifyReport from './pages/VerifyReport';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useHealth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return children;
};

const AppContent = () => {
  const { user } = useHealth();

  return (
    <Routes>
      <Route path="/verify-report/:id" element={<VerifyReport />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            {user?.role === 'doctor' ? (
              <Layout>
                <DoctorDashboard />
              </Layout>
            ) : (
              <Layout>
                <Dashboard />
                <InputForm />
              </Layout>
            )}
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <HealthProvider>
      <AppContent />
    </HealthProvider>
  );
}

export default App;
