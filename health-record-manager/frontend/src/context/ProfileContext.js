import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeProfile, setActiveProfileState] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch the user's Self (default) profile automatically
  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/profiles');
      const selfProfile = data.profiles.find((p) => p.isDefaultProfile) || data.profiles[0] || null;
      setActiveProfileState(selfProfile);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <ProfileContext.Provider value={{ activeProfile, loading, fetchProfiles }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
