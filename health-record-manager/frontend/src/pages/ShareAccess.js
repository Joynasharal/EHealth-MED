import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2, Mail, Clock, Shield, Trash2, Plus, Upload,
  CheckCircle, XCircle, AlertCircle, User, RefreshCw, Eye
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import './ShareAccess.css';

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ access }) => {
  if (access.status === 'revoked') return <span className="badge badge-red"><XCircle size={11} /> Revoked</span>;
  if (access.status === 'expired' || isPast(new Date(access.expiryDate))) return <span className="badge badge-yellow"><AlertCircle size={11} /> Expired</span>;
  return <span className="badge badge-green"><CheckCircle size={11} /> Active</span>;
};

// ─── Access type badge ────────────────────────────────────────────────────────
const AccessTypeBadge = ({ type }) => (
  type === 'upload'
    ? <span className="badge badge-purple"><Upload size={11} /> View + Upload</span>
    : <span className="badge badge-blue"><Eye size={11} /> View Only</span>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 40 }) => {
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#db2777'];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
};

// ─── Share form ───────────────────────────────────────────────────────────────
const ShareForm = ({ profiles, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    targetEmail: '', profileId: '', accessType: 'view', expiryDays: '7', customExpiry: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.profileId) { toast.error('Please select a profile'); return; }
    setSaving(true);
    try {
      await api.post('/access/share', form);
      toast.success('Access shared successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share access');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card share-form fade-in">
      <div className="share-form__header">
        <div className="share-form__header-icon">
          <Share2 size={18} />
        </div>
        <div>
          <h3>New Access Grant</h3>
          <p>Share a profile with a doctor or family member</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Recipient Email *</label>
            <div className="share-input-wrap">
              <Mail size={15} className="share-input-icon" />
              <input type="email" className="form-input" style={{ paddingLeft: 38 }}
                placeholder="doctor@hospital.com"
                value={form.targetEmail}
                onChange={(e) => setForm({ ...form, targetEmail: e.target.value })}
                required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Profile to Share *</label>
            <select className="form-input" value={form.profileId}
              onChange={(e) => setForm({ ...form, profileId: e.target.value })} required>
              <option value="">Select profile...</option>
              {profiles.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.profileName}{p.actualName ? ` (${p.actualName})` : ''} · {p.relationship}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Access type */}
        <div className="form-group">
          <label className="form-label">Permission Level</label>
          <div className="access-type-selector">
            <button type="button"
              className={`access-type-btn ${form.accessType === 'view' ? 'access-type-btn--active' : ''}`}
              onClick={() => setForm({ ...form, accessType: 'view' })}>
              <Shield size={16} />
              <div>
                <p className="access-type-btn__title">View Only</p>
                <p className="access-type-btn__desc">Can view records and AI summary</p>
              </div>
            </button>
            <button type="button"
              className={`access-type-btn ${form.accessType === 'upload' ? 'access-type-btn--active' : ''}`}
              onClick={() => setForm({ ...form, accessType: 'upload' })}>
              <Upload size={16} />
              <div>
                <p className="access-type-btn__title">View + Upload</p>
                <p className="access-type-btn__desc">Can view and add medical records</p>
              </div>
            </button>
          </div>
        </div>

        {/* Expiry */}
        <div className="form-group">
          <label className="form-label">Access Duration</label>
          <div className="duration-selector">
            {[
              { days: '1', label: '1 Day' },
              { days: '7', label: '7 Days' },
              { days: '30', label: '30 Days' },
              { days: '90', label: '3 Months' },
            ].map(({ days, label }) => (
              <button key={days} type="button"
                className={`duration-btn ${form.expiryDays === days && !form.customExpiry ? 'duration-btn--active' : ''}`}
                onClick={() => setForm({ ...form, expiryDays: days, customExpiry: '' })}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="form-label" style={{ marginBottom: 6 }}>Or pick a custom date</label>
            <input type="date" className="form-input"
              value={form.customExpiry}
              onChange={(e) => setForm({ ...form, customExpiry: e.target.value, expiryDays: '' })}
              min={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div className="share-form__actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Sharing...' : <><Share2 size={15} /> Share Access</>}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ShareAccess = () => {
  const { profiles } = useProfile();
  const { user } = useAuth();
  const [tab, setTab] = useState('granted'); // 'granted' | 'received'
  const [grantedList, setGrantedList] = useState([]);
  const [receivedList, setReceivedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [grantedRes, receivedRes] = await Promise.all([
        api.get('/access/granted'),
        api.get('/access/shared-with-me'),
      ]);
      setGrantedList(grantedRes.data.accessList || []);
      setReceivedList(receivedRes.data.accessList || []);
    } catch {
      setGrantedList([]);
      setReceivedList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this access? The recipient will immediately lose access.')) return;
    try {
      await api.delete(`/access/revoke/${id}`);
      toast.success('Access revoked');
      fetchAll();
    } catch {
      toast.error('Failed to revoke access');
    }
  };

  const filteredGranted = grantedList.filter((a) => {
    if (filterStatus === 'active') return a.status === 'active' && !isPast(new Date(a.expiryDate));
    if (filterStatus === 'expired') return a.status === 'expired' || (a.status === 'active' && isPast(new Date(a.expiryDate)));
    if (filterStatus === 'revoked') return a.status === 'revoked';
    return true;
  });

  const activeGrantedCount = grantedList.filter(
    (a) => a.status === 'active' && !isPast(new Date(a.expiryDate))
  ).length;

  return (
    <div className="share-page fade-in">
      {/* Header */}
      <div className="page-header share-page__header">
        <div>
          <h1>Share Access</h1>
          <p>Grant temporary, permission-controlled access to your medical profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Share Access
        </button>
      </div>

      {/* Stats row */}
      <div className="share-stats">
        <div className="share-stat card">
          <div className="share-stat__icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Share2 size={18} />
          </div>
          <div>
            <p className="share-stat__label">Active Grants</p>
            <p className="share-stat__value">{activeGrantedCount}</p>
          </div>
        </div>
        <div className="share-stat card">
          <div className="share-stat__icon" style={{ background: '#f0fdf4', color: '#059669' }}>
            <User size={18} />
          </div>
          <div>
            <p className="share-stat__label">Shared With Me</p>
            <p className="share-stat__value">{receivedList.length}</p>
          </div>
        </div>
        <div className="share-stat card">
          <div className="share-stat__icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
            <Shield size={18} />
          </div>
          <div>
            <p className="share-stat__label">Total Profiles</p>
            <p className="share-stat__value">{profiles.length}</p>
          </div>
        </div>
      </div>

      {/* Share form */}
      {showForm && (
        <ShareForm
          profiles={profiles}
          onSuccess={() => { setShowForm(false); fetchAll(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Tabs */}
      <div className="share-tabs">
        <button
          className={`share-tab ${tab === 'granted' ? 'share-tab--active' : ''}`}
          onClick={() => setTab('granted')}>
          <Share2 size={15} /> Access I've Granted
          {activeGrantedCount > 0 && <span className="share-tab__badge">{activeGrantedCount}</span>}
        </button>
        <button
          className={`share-tab ${tab === 'received' ? 'share-tab--active' : ''}`}
          onClick={() => setTab('received')}>
          <User size={15} /> Shared With Me
          {receivedList.length > 0 && <span className="share-tab__badge">{receivedList.length}</span>}
        </button>
        <button className="btn btn-ghost btn-sm share-refresh" onClick={fetchAll} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : tab === 'granted' ? (
        <GrantedTab
          list={filteredGranted}
          allList={grantedList}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onRevoke={handleRevoke}
          onShare={() => setShowForm(true)}
        />
      ) : (
        <ReceivedTab list={receivedList} />
      )}
    </div>
  );
};

// ─── Granted tab ──────────────────────────────────────────────────────────────
const GrantedTab = ({ list, allList, filterStatus, setFilterStatus, onRevoke, onShare }) => {
  if (allList.length === 0) {
    return (
      <div className="empty-state card" style={{ padding: '60px 20px' }}>
        <Share2 size={48} />
        <h3>No access grants yet</h3>
        <p>Share a profile with a doctor or family member to get started</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onShare}>
          <Plus size={16} /> Share Access
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="share-filter-bar">
        {['all', 'active', 'expired', 'revoked'].map((s) => (
          <button key={s}
            className={`share-filter-btn ${filterStatus === s ? 'share-filter-btn--active' : ''}`}
            onClick={() => setFilterStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="share-filter-count">
              {s === 'all' ? allList.length
                : s === 'active' ? allList.filter((a) => a.status === 'active' && !isPast(new Date(a.expiryDate))).length
                : allList.filter((a) => a.status === s || (s === 'expired' && a.status === 'active' && isPast(new Date(a.expiryDate)))).length}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-state card" style={{ padding: '40px 20px' }}>
          <AlertCircle size={36} />
          <h3>No {filterStatus} grants</h3>
        </div>
      ) : (
        <div className="access-cards">
          {list.map((access) => {
            const isActive = access.status === 'active' && !isPast(new Date(access.expiryDate));
            return (
              <div key={access._id} className={`access-card card ${!isActive ? 'access-card--inactive' : ''}`}>
                <div className="access-card__left">
                  <Avatar name={access.targetEmail} size={44} />
                  <div>
                    <p className="access-card__name">
                      {access.targetUserId?.fullName || access.targetEmail}
                    </p>
                    <p className="access-card__email">{access.targetEmail}</p>
                    <p className="access-card__profile">
                      {access.profileId?.profileName}
                      {access.profileId?.actualName ? ` · ${access.profileId.actualName}` : ''}
                      {' · '}{access.profileId?.relationship}
                    </p>
                  </div>
                </div>

                <div className="access-card__meta">
                  <AccessTypeBadge type={access.accessType} />
                  <StatusBadge access={access} />
                  <div className="access-card__expiry">
                    <Clock size={12} />
                    <span>
                      {isActive
                        ? `Expires ${formatDistanceToNow(new Date(access.expiryDate), { addSuffix: true })}`
                        : `Expired ${format(new Date(access.expiryDate), 'MMM d, yyyy')}`}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <button className="btn btn-danger btn-sm access-card__revoke" onClick={() => onRevoke(access._id)}>
                    <Trash2 size={13} /> Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Received tab ─────────────────────────────────────────────────────────────
const ReceivedTab = ({ list }) => {
  if (list.length === 0) {
    return (
      <div className="empty-state card" style={{ padding: '60px 20px' }}>
        <User size={48} />
        <h3>No shared profiles</h3>
        <p>When someone shares a profile with you, it will appear here</p>
      </div>
    );
  }

  return (
    <div className="access-cards">
      {list.map((access) => (
        <div key={access._id} className="access-card access-card--received card">
          <div className="access-card__left">
            <Avatar name={access.ownerUserId?.fullName} size={44} />
            <div>
              <p className="access-card__name">{access.ownerUserId?.fullName}</p>
              <p className="access-card__email">{access.ownerUserId?.email}</p>
              <p className="access-card__profile">
                Profile: <strong>{access.profileId?.profileName}</strong>
                {access.profileId?.actualName ? ` (${access.profileId.actualName})` : ''}
                {' · '}{access.profileId?.age}y · {access.profileId?.gender}
              </p>
            </div>
          </div>

          <div className="access-card__meta">
            <AccessTypeBadge type={access.accessType} />
            <div className="access-card__expiry">
              <Clock size={12} />
              <span>Expires {formatDistanceToNow(new Date(access.expiryDate), { addSuffix: true })}</span>
            </div>
          </div>

          <a href="/doctor" className="btn btn-secondary btn-sm">
            <Eye size={13} /> View Records
          </a>
        </div>
      ))}
    </div>
  );
};

export default ShareAccess;
