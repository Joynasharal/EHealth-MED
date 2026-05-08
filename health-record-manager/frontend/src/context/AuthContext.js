import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hrm_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('hrm_token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const _storeSession = (token, userData) => {
    localStorage.setItem('hrm_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    _storeSession(data.token, data.user);
    toast.success(`Welcome back, ${data.user.fullName.split(' ')[0]}!`);
    return data;
  };

  const signup = async (fullName, email, password, role) => {
    const { data } = await api.post('/auth/signup', { fullName, email, password, role });
    _storeSession(data.token, data.user);
    toast.success('Account created successfully!');
    return data;
  };

  // Google Sign-In: accepts either a credential (ID token) or a userInfo object
  // from the Google userinfo endpoint (when using implicit/access_token flow)
  const googleLogin = async (credential, role = 'patient', userInfo = null) => {
    const payload = userInfo
      ? { userInfo, role }
      : { credential, role };
    const { data } = await api.post('/auth/google', payload);
    _storeSession(data.token, data.user);
    const isNew = data.message?.includes('created');
    toast.success(isNew ? 'Welcome to Health Record Manager!' : `Welcome back, ${data.user.fullName.split(' ')[0]}!`);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('hrm_token');
    localStorage.removeItem('hrm_active_profile');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  // Persist active profile to backend + localStorage
  const setActiveProfile = async (profileId) => {
    try {
      const { data } = await api.put('/auth/active-profile', { profileId });
      setUser(data.user);
      localStorage.setItem('hrm_active_profile', profileId);
    } catch (err) {
      console.error('Failed to persist active profile', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, signup, googleLogin, logout,
      updateUser, fetchMe, setActiveProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
