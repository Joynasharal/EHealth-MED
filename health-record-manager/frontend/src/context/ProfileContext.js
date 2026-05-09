import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

// Thin wrapper — exposes activeOwnerId so pages can use it for API calls
export const ProfileProvider = ({ children }) => {
  const { user, activeOwnerId } = useAuth();
  const activeProfile = user ? { _id: activeOwnerId || user._id } : null;

  return (
    <ProfileContext.Provider value={{ activeProfile, loading: false }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
