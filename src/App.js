// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import OwnerDashboard from './components/Owner/OwnerDashboard';
import PropertyDetails from './components/Owner/PropertyDetails';
import BillSettings from './components/Owner/BillSettings';
import TenantDashboard from './components/Tenant/TenantDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userProfile?.role !== allowedRole) {
    return <Navigate to={userProfile?.role === 'owner' ? '/owner' : '/tenant'} replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser, userProfile } = useAuth();

  if (currentUser && userProfile) {
    return <Navigate to={userProfile.role === 'owner' ? '/owner' : '/tenant'} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '10px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } 
          />

          {/* Owner Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/property/:propertyId"
            element={
              <ProtectedRoute allowedRole="owner">
                <PropertyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/bill-settings"
            element={
              <ProtectedRoute allowedRole="owner">
                <BillSettings />
              </ProtectedRoute>
            }
          />

          {/* Tenant Routes */}
          <Route
            path="/tenant"
            element={
              <ProtectedRoute allowedRole="tenant">
                <TenantDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
