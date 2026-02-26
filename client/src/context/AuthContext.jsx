import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.data.user);
    return res.data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.delete('/auth/logout');
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const res = await api.patch('/auth/profile', { profile: profileData });
    setUser(res.data.data);
    return res.data;
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, updateProfile, loading, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
