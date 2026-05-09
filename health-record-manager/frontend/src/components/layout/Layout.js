import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Upload, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const ACCESS_BADGE = {
  view:   { color: '#2563eb', icon: Eye,      label: 'View Only' },
  upload: { color: '#7c3aed', icon: Upload,   label: 'View + Upload' },
  manage: { color: '#dc2626', icon: Settings, label: 'Full Manage' },
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sharedAccount, exitSharedAccount } = useAuth();
  const navigate = useNavigate();

  const handleExitShared = () => {
    exitSharedAccount();
    navigate('/dashboard');
  };

  const badge = sharedAccount ? (ACCESS_BADGE[sharedAccount.accessType] || ACCESS_BADGE.view) : null;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Shared account context banner */}
        {sharedAccount && (
          <div className="shared-account-banner" style={{ borderLeftColor: badge.color }}>
            <div className="shared-account-banner__left">
              <span className="shared-account-banner__label">Viewing:</span>
              <strong className="shared-account-banner__name">{sharedAccount.fullName}'s Health Records</strong>
              <span className="badge" style={{ background: badge.color + '18', color: badge.color, fontSize: 11 }}>
                <badge.icon size={11} /> {badge.label}
              </span>
            </div>
            <button className="btn btn-ghost btn-sm shared-account-banner__exit" onClick={handleExitShared}>
              <ArrowLeft size={13} /> Back to My Account
            </button>
          </div>
        )}

        <div className="page-container fade-in">
          <Outlet />
        </div>
      </div>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Layout;
