import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user, setActiveProfile: persistActiveProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfileState] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/profiles');
      setProfiles(data.profiles);

      // Priority: backend activeProfileId > localStorage > default (Self) profile > first
      const backendActiveId = user.activeProfileId;
      const localId = localStorage.getItem('hrm_active_profile');
      const preferredId = backendActiveId || localId;

      const found = preferredId
        ? data.profiles.find((p) => p._id === preferredId)
        : null;

      // Fall back to Self profile, then first profile
      const selfProfile = data.profiles.find((p) => p.isDefaultProfile);
      const resolved = found || selfProfile || data.profiles[0] || null;

      setActiveProfileState(resolved);
      if (resolved) localStorage.setItem('hrm_active_profile', resolved._id);
    } catch (err) {
      console.error('Failed to fetch profiles', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const switchProfile = async (profile) => {
    setActiveProfileState(profile);
    localStorage.setItem('hrm_active_profile', profile._id);
    // Persist to backend
    if (persistActiveProfile) {
      await persistActiveProfile(profile._id);
    }
  };

  const addProfile = (profile) => {
    setProfiles((prev) => [...prev, profile]);
    if (!activeProfile) {
      setActiveProfileState(profile);
      localStorage.setItem('hrm_active_profile', profile._id);
    }
  };

  const updateProfileInList = (updated) => {
    setProfiles((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    if (activeProfile?._id === updated._id) setActiveProfileState(updated);
  };

  const removeProfile = (id) => {
    setProfiles((prev) => prev.filter((p) => p._id !== id));
    if (activeProfile?._id === id) {
      const remaining = profiles.filter((p) => p._id !== id);
      const next = remaining.find((p) => p.isDefaultProfile) || remaining[0] || null;
      setActiveProfileState(next);
      if (next) localStorage.setItem('hrm_active_profile', next._id);
    }
  };

  return (
    <ProfileContext.Provider value={{
      profiles, activeProfile, loading,
      fetchProfiles, switchProfile, addProfile, updateProfileInList, removeProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
