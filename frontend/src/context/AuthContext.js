import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Attempting login for user:', username);
      // Use direct endpoint to bypass router issues
      const response = await api.post('/auth/login_direct.php', {
        username,
        password
      });

      console.log('Login response:', response.data);

      const { token, user } = response.data;
      
      if (!token || !user) {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        console.error('Server error message:', errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Cannot reach server. Please check if the backend is running.';
        console.error('Network error - no response received');
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
        console.error('Other error:', errorMessage);
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

