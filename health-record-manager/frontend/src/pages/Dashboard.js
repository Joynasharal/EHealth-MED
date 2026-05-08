import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, ClipboardList, Share2, UserPlus, FileText,
  TrendingUp, Users, Activity, Calendar, ArrowRight, Sparkles,
  Pill, FlaskConical, Scan, ClipboardCheck, Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import api from '../services/api';
import { format } from 'date-fns';
import './Dashboard.css';

// ─── Type icon map ────────────────────────────────────────────────────────────
const TYPE_ICONS = {
  Prescription: Pill, 'Lab Report': FlaskConical, Scan: Scan,
  'Discharge Summary': ClipboardCheck, 'Medical Bill': Receipt,
  Vaccination: Activity, Other: FileText,
};
const TYPE_COLORS = {
  Prescription: '#2563eb', 'Lab Report': '#7c3aed', Scan: '#059669',
  'Discharge Summary': '#d97706', 'Medical Bill': '#0891b2',
  Vaccination: '#db2777', Other: '#64748b',
};

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="stat-card card">
    <div className="stat-card__icon" style={{ background: color + '18', color }}>
      <Icon size={22} />
    </div>
    <div className="stat-card__body">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value ?? '—'}</p>
      {trend && <p className="stat-card__trend">{trend}</p>}
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, desc, color, onClick }) => (
  <button className="quick-action card" onClick={onClick}>
    <div className="quick-action__icon" style={{ background: color + '18', color }}>
      <Icon size={22} />
    </div>
    <div>
      <p className="quick-action__label">{label}</p>
      <p className="quick-action__desc">{desc}</p>
    </div>
    <ArrowRight size={16} className="quick-action__arrow" />
  </button>
);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const Dashboard = () => {
  const { user } = useAuth();
  const { activeProfile, profiles } = useProfile();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setStats(data.stats);
      } catch {
        // use empty state
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const firstName = user?.fullName?.split(' ')[0] || 'User';

  return (
    <div className="dashboard fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner__content">
          <div className="welcome-banner__text">
            <p className="welcome-banner__greeting">{getGreeting()}</p>
            <h1 className="welcome-banner__name">{firstName}</h1>
            <p className="welcome-banner__sub">
              {activeProfile
                ? `Viewing records for ${activeProfile.profileName} · ${activeProfile.relationship}`
                : 'Manage your family health records securely'}
            </p>
          </div>
          <div className="welcome-banner__badge">
            <Sparkles size={16} />
            <span>AI-Powered</span>
          </div>
        </div>
        <div className="welcome-banner__decoration">
          <div className="welcome-banner__circle welcome-banner__circle--1" />
          <div className="welcome-banner__circle welcome-banner__circle--2" />
          <div className="welcome-banner__circle welcome-banner__circle--3" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon={FileText} label="Total Records" value={loading ? '...' : stats?.totalRecords ?? 0} color="#2563eb" trend="All time" />
        <StatCard icon={Users} label="Family Profiles" value={loading ? '...' : profiles.length} color="#7c3aed" trend="Active" />
        <StatCard icon={Activity} label="This Month" value={loading ? '...' : stats?.recordsThisMonth ?? 0} color="#059669" trend="New uploads" />
        <StatCard icon={TrendingUp} label="AI Processed" value={loading ? '...' : stats?.totalRecords ?? 0} color="#f59e0b" trend="OCR scanned" />
      </div>

      <div className="dashboard__grid">
        {/* Quick Actions */}
        <div className="dashboard__section">
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <div className="quick-actions-grid">
            <QuickAction icon={Upload} label="Upload Record" desc="Add prescription or report" color="#2563eb" onClick={() => navigate('/upload')} />
            <QuickAction icon={ClipboardList} label="Medical History" desc="Browse all records" color="#7c3aed" onClick={() => navigate('/history')} />
            <QuickAction icon={Share2} label="Share Access" desc="Grant doctor access" color="#059669" onClick={() => navigate('/share')} />
            <QuickAction icon={UserPlus} label="Add Profile" desc="Manage family members" color="#f59e0b" onClick={() => navigate('/profiles')} />
          </div>
        </div>

        {/* Recent Records */}
        <div className="dashboard__section">
          <div className="section-header">
            <h2 className="section-title">Recent Uploads</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="recent-records card">
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : stats?.recentRecords?.length > 0 ? (
              stats.recentRecords.map((record) => {
                const color = TYPE_COLORS[record.recordType] || '#64748b';
                const Icon = TYPE_ICONS[record.recordType] || FileText;

                // Build structured title per type
                const getTitle = () => {
                  switch (record.recordType) {
                    case 'Lab Report':
                      return record.labTests?.[0]?.testName
                        ? `${record.labTests[0].testName}${record.labTests.length > 1 ? ` +${record.labTests.length - 1}` : ''}`
                        : record.impression || 'Lab Report';
                    case 'Scan': return record.scanType || 'Scan Report';
                    case 'Discharge Summary': return record.diagnosis || 'Discharge Summary';
                    case 'Medical Bill': return record.billNumber ? `Bill #${record.billNumber}` : 'Medical Bill';
                    default: return record.diagnosis || record.recordType || 'Medical Record';
                  }
                };

                // Build structured subtitle per type
                const getSubtitle = () => {
                  const parts = [];
                  if (record.doctorName) parts.push(`Dr. ${record.doctorName}`);
                  else if (record.labName) parts.push(record.labName);
                  else if (record.hospitalName) parts.push(record.hospitalName);
                  if (record.visitDate) parts.push(format(new Date(record.visitDate), 'MMM d, yyyy'));
                  else if (record.admissionDate) parts.push(`Admitted: ${record.admissionDate}`);
                  return parts.join(' · ');
                };

                return (
                  <div key={record._id} className="recent-record-item"
                    onClick={() => navigate(`/history/${record._id}`)}>
                    <div className="recent-record__icon" style={{ background: color + '18', color }}>
                      <Icon size={17} />
                    </div>
                    <div className="recent-record__info">
                      <p className="recent-record__title">{getTitle()}</p>
                      <p className="recent-record__meta">{getSubtitle()}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className="badge" style={{ background: color + '18', color, fontSize: 10 }}>
                        {record.recordType}
                      </span>
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>
                        {record.profileId?.relationship || 'Self'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <FileText size={40} />
                <h3>No records yet</h3>
                <p>Upload your first medical record to get started</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/upload')}>
                  Upload Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Summary */}
        <div className="dashboard__section">
          <div className="section-header">
            <h2 className="section-title">Family Profiles</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profiles')}>
              Manage <ArrowRight size={14} />
            </button>
          </div>
          <div className="profile-cards">
            {profiles.length > 0 ? profiles.map((profile) => (
              <div key={profile._id} className={`profile-mini card ${activeProfile?._id === profile._id ? 'profile-mini--active' : ''}`}>
                <div className="profile-mini__avatar" style={{ background: getAvatarColor(profile.profileName) }}>
                  {profile.profileName[0].toUpperCase()}
                </div>
                <div className="profile-mini__info">
                  <p className="profile-mini__name">{profile.profileName}</p>
                  <p className="profile-mini__meta">{profile.age}y · {profile.bloodGroup} · {profile.relationship}</p>
                </div>
                {activeProfile?._id === profile._id && <span className="badge badge-blue">Active</span>}
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <Users size={36} />
                <h3>No profiles</h3>
                <p>Add family members to manage their records</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's date card */}
        <div className="dashboard__section">
          <div className="section-header">
            <h2 className="section-title">Today</h2>
          </div>
          <div className="today-card card">
            <div className="today-card__date">
              <p className="today-card__day">{format(new Date(), 'EEEE')}</p>
              <p className="today-card__num">{format(new Date(), 'd')}</p>
              <p className="today-card__month">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
            <div className="divider" />
            <div className="today-card__actions">
              <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/upload')}>
                <Upload size={15} /> Upload Record
              </button>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => navigate('/insights')}>
                <TrendingUp size={15} /> View Insights
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getAvatarColor = (name) => {
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
  return colors[name?.charCodeAt(0) % colors.length] || '#2563eb';
};

export default Dashboard;
