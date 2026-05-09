import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Topbar.css';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userDropdown, setUserDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getAvatarColor = (name) => {
    const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

        {/* User menu */}
        <div className="topbar__profile-switcher" ref={dropdownRef}>
          <button
            className="topbar__profile-btn"
            onClick={() => setUserDropdown(!userDropdown)}
          >
            <div
              className="topbar__avatar"
              style={{ background: getAvatarColor(user?.fullName) }}
            >
              {user?.profilePhoto
                ? <img src={user.profilePhoto} alt={user.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : getInitials(user?.fullName)}
            </div>
            <div className="topbar__profile-info">
              <span className="topbar__profile-name">{user?.fullName}</span>
              <span className="topbar__profile-role">{user?.role}</span>
            </div>
            <ChevronDown size={14} className={`topbar__chevron ${userDropdown ? 'topbar__chevron--open' : ''}`} />
          </button>

          {userDropdown && (
            <div className="topbar__dropdown">
              <div className="topbar__dropdown-user">
                <p className="topbar__dropdown-name">{user?.fullName}</p>
                <p className="topbar__dropdown-rel">{user?.email}</p>
              </div>
              <div className="topbar__dropdown-divider" />
              <button
                className="topbar__dropdown-item"
                onClick={() => { navigate('/settings'); setUserDropdown(false); }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </button>
              <button
                className="topbar__dropdown-item topbar__dropdown-item--danger"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
