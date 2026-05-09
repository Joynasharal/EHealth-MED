import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, Calendar, Building2, Pill,
  FlaskConical, Scan, ClipboardList, Receipt, Syringe,
  Upload, Edit2, Trash2, Clock, Shield, Settings,
  AlertCircle, ChevronRight, Activity, TrendingUp, TrendingDown,
  CheckCircle, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import './ManagedAccount.css';

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Prescription:        { color: '#2563eb', icon: Pill },
  'Lab Report':        { color: '#7c3aed', icon: FlaskConical },
  Scan:                { color: '#059669', icon: Scan },
  'Discharge Summary': { color: '#d97706', icon: ClipboardList },
  'Medical Bill':      { color: '#0891b2', icon: Receipt },
  Vaccination:         { color: '#db2777', icon: Syringe },
  Other:               { color: '#64748b', icon: FileText },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, photo, size = 44 }) => {
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2'];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (photo) return (
    <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: size * 0.27, objectFit: 'cover', flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.27, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
};

// ─── Lab status badge ─────────────────────────────────────────────────────────
const LabStatus = ({ status }) => {
  const map = {
    high: { cls: 'badge-red', icon: TrendingUp },
    low: { cls: 'badge-yellow', icon: TrendingDown },
    normal: { cls: 'badge-green', icon: CheckCircle },
    positive: { cls: 'badge-red', icon: AlertCircle },
    negative: { cls: 'badge-green', icon: CheckCircle },
    borderline: { cls: 'badge-yellow', icon: AlertCircle },
  };
  const cfg = map[status] || { cls: 'badge-gray', icon: Activity };
  const Icon = cfg.icon;
  return <span className={`badge ${cfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10 }}><Icon size={9} /> {status}</span>;
};

// ─── Record card ──────────────────────────────────────────────────────────────
const RecordCard = ({ record, onDelete, onNavigate, canManage }) => {
  const cfg = TYPE_CONFIG[record.recordType] || TYPE_CONFIG.Other;
  const Icon = cfg.icon;
  const color = cfg.color;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this record?')) return;
    setDeleting(true);
    try {
      await api.delete(`/records/${record._id}`);
      toast.success('Record deleted');
      onDelete(record._id);
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="managed-record card" onClick={() => onNavigate(record._id)}>
      <div className="managed-record__icon" style={{ background: color + '18', color }}>
        <Icon size={18} />
      </div>
      <div className="managed-record__body">
        <div className="managed-record__top">
          <h4 className="managed-record__title">
            {record.diagnosis || record.recordType}
          </h4>
          <span className="badge" style={{ background: color + '18', color, fontSize: 10 }}>
            {record.recordType}
          </span>
        </div>
        <div className="managed-record__meta">
          {record.doctorName && <span><User size={11} /> Dr. {record.doctorName}</span>}
          {record.hospitalName && <span><Building2 size={11} /> {record.hospitalName}</span>}
          {record.visitDate && <span><Calendar size={11} /> {format(new Date(record.visitDate), 'MMM d, yyyy')}</span>}
        </div>
        {record.medicines?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {record.medicines.slice(0, 3).map((m, i) => (
              <span key={i} className="badge badge-gray" style={{ fontSize: 10 }}>{m.name}</span>
            ))}
            {record.medicines.length > 3 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{record.medicines.length - 3}</span>}
          </div>
        )}
        {record.labTests?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {record.labTests.slice(0, 3).map((t, i) => (
              <span key={i} style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {t.testName} <LabStatus status={t.status} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="managed-record__actions" onClick={(e) => e.stopPropagation()}>
        {canManage && (
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <RefreshCw size={12} className="spin-icon" /> : <Trash2 size={12} />}
          </button>
        )}
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ManagedAccount = () => {
  const { ownerUserId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null); // { owner, profiles, recordsByProfile, accessType, expiryDate }
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/access/managed-account/${ownerUserId}`);
      setData(res);
      // Auto-select first profile
      if (res.profiles?.length > 0 && !selectedProfileId) {
        setSelectedProfileId(res.profiles[0]._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access denied or expired');
      navigate('/share');
    } finally {
      setLoading(false);
    }
  }, [ownerUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecordDeleted = (recordId) => {
    setData((prev) => {
      const updated = { ...prev, recordsByProfile: { ...prev.recordsByProfile } };
      Object.keys(updated.recordsByProfile).forEach((pid) => {
        updated.recordsByProfile[pid] = updated.recordsByProfile[pid].filter((r) => r._id !== recordId);
      });
      return updated;
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  if (!data) return null;

  const { owner, profiles, recordsByProfile, accessType, expiryDate } = data;
  const canUpload = accessType === 'upload' || accessType === 'manage';
  const canManage = accessType === 'manage';
  const selectedProfile = profiles.find((p) => p._id === selectedProfileId);
  const selectedRecords = selectedProfileId ? (recordsByProfile[selectedProfileId] || []) : [];

  // Access badge config
  const accessBadge = {
    view:   { cls: 'badge-blue',   icon: Shield,   label: 'View Only' },
    upload: { cls: 'badge-purple', icon: Upload,   label: 'View + Upload' },
    manage: { cls: 'badge-red',    icon: Settings, label: 'Full Manage' },
  }[accessType] || { cls: 'badge-gray', icon: Shield, label: accessType };

  return (
    <div className="managed-account fade-in">
      {/* Header */}
      <div className="managed-account__header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/share')}>
          <ArrowLeft size={15} /> Back to Share Access
        </button>
        <div className="managed-account__owner-info">
          <Avatar name={owner.fullName} photo={owner.profilePhoto} size={36} />
          <div>
            <span className="managed-account__owner-name">{owner.fullName}</span>
            <span className="managed-account__owner-email">{owner.email}</span>
          </div>
          <span className={`badge ${accessBadge.cls}`} style={{ marginLeft: 8 }}>
            <accessBadge.icon size={11} /> {accessBadge.label}
          </span>
        </div>
        <div className="managed-account__expiry">
          <Clock size={13} />
          <span>Access expires {formatDistanceToNow(new Date(expiryDate), { addSuffix: true })}</span>
        </div>
      </div>

      <div className="managed-account__layout">
        {/* ── Left: profile list ─────────────────────────────────────────── */}
        <div className="managed-account__sidebar card">
          <div className="managed-account__sidebar-header">
            <h3>Profiles</h3>
            <span className="badge badge-blue">{profiles.length}</span>
          </div>
          <div className="managed-profile-list">
            {profiles.map((profile) => {
              const records = recordsByProfile[profile._id] || [];
              const isSelected = selectedProfileId === profile._id;
              return (
                <button
                  key={profile._id}
                  className={`managed-profile-item ${isSelected ? 'managed-profile-item--active' : ''}`}
                  onClick={() => setSelectedProfileId(profile._id)}>
                  <Avatar name={profile.profileName} size={38} />
                  <div className="managed-profile-info">
                    <p className="managed-profile-name">{profile.profileName}</p>
                    <p className="managed-profile-meta">
                      {profile.actualName && `${profile.actualName} · `}
                      {profile.age}y · {profile.gender}
                    </p>
                    <p className="managed-profile-count">{records.length} records</p>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: records panel ───────────────────────────────────────── */}
        <div className="managed-account__main">
          {!selectedProfile ? (
            <div className="empty-state card" style={{ padding: '60px 20px' }}>
              <User size={48} />
              <h3>Select a profile</h3>
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div className="card managed-profile-header">
                <Avatar name={selectedProfile.profileName} size={52} />
                <div style={{ flex: 1 }}>
                  <h2>{selectedProfile.profileName}</h2>
                  {selectedProfile.actualName && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedProfile.actualName}</p>
                  )}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <User size={12} /> {selectedProfile.age}y · {selectedProfile.gender}
                    </span>
                    {selectedProfile.bloodGroup && (
                      <span style={{ fontSize: 13, color: '#ef4444' }}>Blood: {selectedProfile.bloodGroup}</span>
                    )}
                    {selectedProfile.relationship && (
                      <span className="badge badge-gray">{selectedProfile.relationship}</span>
                    )}
                  </div>
                  {selectedProfile.allergies?.length > 0 && (
                    <p style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>
                      Allergies: {selectedProfile.allergies.join(', ')}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {canUpload && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/upload?profileId=${selectedProfile._id}&managedOwner=${ownerUserId}`)}>
                      <Upload size={13} /> Upload Record
                    </button>
                  )}
                </div>
              </div>

              {/* Records */}
              <div className="managed-records-header">
                <h3>Medical Records</h3>
                <span className="badge badge-gray">{selectedRecords.length}</span>
              </div>

              {selectedRecords.length === 0 ? (
                <div className="empty-state card" style={{ padding: '40px 20px' }}>
                  <FileText size={36} />
                  <h3>No records yet</h3>
                  <p>{canUpload ? 'Upload the first medical record for this profile' : 'No records have been added yet'}</p>
                  {canUpload && (
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 16 }}
                      onClick={() => navigate(`/upload?profileId=${selectedProfile._id}&managedOwner=${ownerUserId}`)}>
                      <Upload size={14} /> Upload Record
                    </button>
                  )}
                </div>
              ) : (
                <div className="managed-records-list">
                  {selectedRecords.map((record) => (
                    <RecordCard
                      key={record._id}
                      record={record}
                      canManage={canManage}
                      onDelete={handleRecordDeleted}
                      onNavigate={(id) => navigate(`/history/${id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagedAccount;
