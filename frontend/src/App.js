import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import LawyerList from './components/Lawyers/LawyerList';
import LawyerDetail from './components/Lawyers/LawyerDetail';
import LawyerForm from './components/Lawyers/LawyerForm';
import PublicSearch from './components/Public/PublicSearch';
import PublicLawyerDetail from './components/Public/PublicLawyerDetail';
import Navbar from './components/Layout/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && user.role === 'ADMIN' ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicSearch />} />
      <Route path="/lawyer/:id" element={<PublicLawyerDetail />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/lawyers"
        element={
          <PrivateRoute>
            <LawyerList />
          </PrivateRoute>
        }
      />
      <Route
        path="/lawyers/new"
        element={
          <AdminRoute>
            <LawyerForm />
          </AdminRoute>
        }
      />
      <Route
        path="/lawyers/:id/edit"
        element={
          <AdminRoute>
            <LawyerForm />
          </AdminRoute>
        }
      />
      <Route
        path="/lawyers/:id"
        element={
          <PrivateRoute>
            <LawyerDetail />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

