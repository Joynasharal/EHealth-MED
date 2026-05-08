import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, ChevronDown, Plus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfile } from '../../context/ProfileContext';
import './Topbar.css';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { profiles, activeProfile, switchProfile } = useProfile();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getAvatarColor = (name) => {
    const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
    const idx = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[idx];
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="topbar__search">
          <Search size={16} className="topbar__search-icon" />
          <input
            type="text"
            placeholder="Search records, doctors, diagnoses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="topbar__search-input"
          />
        </div>
      </div>

      <div className="topbar__right">
        {/* Theme toggle */}
        <button className="topbar__icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <button className="topbar__icon-btn topbar__notif" aria-label="Notifications">
          <Bell size={18} />
          <span className="topbar__notif-dot" />
        </button>

        {/* Profile switcher */}
        <div className="topbar__profile-switcher" ref={dropdownRef}>
          <button
            className="topbar__profile-btn"
            onClick={() => setProfileDropdown(!profileDropdown)}
          >
            <div
              className="topbar__avatar"
              style={{ background: getAvatarColor(activeProfile?.profileName || user?.fullName) }}
            >
              {getInitials(activeProfile?.profileName || user?.fullName)}
            </div>
            <div className="topbar__profile-info">
              <span className="topbar__profile-name">
                {activeProfile?.profileName || user?.fullName}
              </span>
              <span className="topbar__profile-role">
                {activeProfile?.relationship || user?.role}
              </span>
            </div>
            <ChevronDown size={14} className={`topbar__chevron ${profileDropdown ? 'topbar__chevron--open' : ''}`} />
          </button>

          {profileDropdown && (
            <div className="topbar__dropdown">
              <p className="topbar__dropdown-label">Switch Profile</p>
              {profiles.map((profile) => (
                <button
                  key={profile._id}
                  className={`topbar__dropdown-item ${activeProfile?._id === profile._id ? 'topbar__dropdown-item--active' : ''}`}
                  onClick={() => { switchProfile(profile); setProfileDropdown(false); }}
                >
                  <div
                    className="topbar__dropdown-avatar"
                    style={{ background: getAvatarColor(profile.profileName) }}
                  >
                    {getInitials(profile.profileName)}
                  </div>
                  <div>
                    <p className="topbar__dropdown-name">{profile.profileName}</p>
                    <p className="topbar__dropdown-rel">{profile.relationship}</p>
                  </div>
                  {activeProfile?._id === profile._id && <Check size={14} className="topbar__dropdown-check" />}
                </button>
              ))}
              <div className="topbar__dropdown-divider" />
              <button
                className="topbar__dropdown-item topbar__dropdown-add"
                onClick={() => { navigate('/profiles'); setProfileDropdown(false); }}
              >
                <div className="topbar__dropdown-avatar topbar__dropdown-avatar--add">
                  <Plus size={14} />
                </div>
                <span>Add Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
