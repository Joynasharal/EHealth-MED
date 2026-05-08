import React, { useState } from 'react';
import { User, Lock, Bell, Moon, Sun, Save, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/update', profileForm);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="settings-page fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and security</p>
      </div>

      <div className="settings-layout">
        {/* Profile settings */}
        <div className="card settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <User size={20} />
            </div>
            <div>
              <h3>Profile Information</h3>
              <p>Update your account details</p>
            </div>
          </div>
          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" value={user?.email || ''} disabled style={{ opacity: .6 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</p>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" value={user?.role || ''} disabled style={{ opacity: .6, textTransform: 'capitalize' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Lock size={20} />
            </div>
            <div>
              <h3>Change Password</h3>
              <p>Keep your account secure</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : <><Shield size={15} /> Update Password</>}
            </button>
          </form>
        </div>

        {/* Appearance */}
        <div className="card settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <h3>Appearance</h3>
              <p>Customize your interface</p>
            </div>
          </div>
          <div className="settings-theme-toggle">
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Dark Mode</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Switch between light and dark theme</p>
            </div>
            <button
              className={`theme-toggle-btn ${theme === 'dark' ? 'theme-toggle-btn--on' : ''}`}
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              <span className="theme-toggle-btn__knob" />
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="card settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon" style={{ background: '#f0fdf4', color: '#059669' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3>Account Info</h3>
              <p>Your account details</p>
            </div>
          </div>
          <div className="settings-info-list">
            <div className="settings-info-item">
              <span className="settings-info-label">Member Since</span>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-label">Last Login</span>
              <span>{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-label">Account Type</span>
              <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
