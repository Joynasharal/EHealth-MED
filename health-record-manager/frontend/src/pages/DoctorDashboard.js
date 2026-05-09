import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope, User, Calendar, FileText, ChevronRight,
  Brain, Clock, Upload, Shield, Activity, Pill,
  Building2, AlertCircle, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import './DoctorDashboard.css';

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 44 }) => {
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2'];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff',
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() || 'P'}
    </div>
  );
};

// ─── Record type colors ───────────────────────────────────────────────────────
const TYPE_COLORS = {
  Prescription: '#2563eb', 'Lab Report': '#7c3aed', Scan: '#059669',
  'Discharge Summary': '#d97706', Vaccination: '#0891b2', Other: '#64748b',
};

// ─── Main component ───────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const { user } = useAuth();
  const [sharedProfiles, setSharedProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profileData, setProfileData] = useState(null); // { profile, records, accessType, expiryDate }
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summaryTab, setSummaryTab] = useState('patient');

  // Fetch all profiles shared with me
  const fetchShared = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/access/shared-with-me');
      setSharedProfiles(data.accessList || []);
    } catch {
      setSharedProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShared(); }, [fetchShared]);

  // Load records + summary for selected profile
  const loadProfile = async (accessItem) => {
    setSelected(accessItem);
    setDetailLoading(true);
    setProfileData(null);
    setSummary(null);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        api.get(`/access/shared-profile/${accessItem.profileId._id}`),
        api.get(`/summary/${accessItem.profileId._id}`).catch(() => null),
      ]);
      setProfileData(recordsRes.data);
      if (summaryRes) setSummary(summaryRes.data.summary);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="doctor-page fade-in">
      <div className="page-header">
        <div>
          <h1>Doctor View</h1>
          <p>Shared patient profiles and medical timelines</p>
        </div>
        {user?.role !== 'doctor' && (
          <div className="doctor-role-notice">
            <AlertCircle size={14} />
            <span>Viewing as patient — switch to a doctor account to see profiles shared with you</span>
          </div>
        )}
      </div>

      <div className="doctor-layout">
        {/* ── Left: patient list ─────────────────────────────────────────── */}
        <div className="doctor-sidebar card">
          <div className="doctor-sidebar__header">
            <h3>Shared Profiles</h3>
            <span className="badge badge-blue">{sharedProfiles.length}</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : sharedProfiles.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              <Stethoscope size={36} />
              <h3>No shared profiles</h3>
              <p>Patients will appear here when they share access with your email</p>
            </div>
          ) : (
            <div className="doctor-patient-list">
              {sharedProfiles.map((item) => {
                const isSelected = selected?.profileId?._id === item.profileId?._id;
                const profile = item.profileId;
                return (
                  <button
                    key={item._id}
                    className={`doctor-patient-item ${isSelected ? 'doctor-patient-item--active' : ''}`}
                    onClick={() => loadProfile(item)}
                  >
                    <Avatar name={profile?.profileName} size={42} />
                    <div className="doctor-patient-info">
                      <p className="doctor-patient-name">{profile?.profileName}</p>
                      <p className="doctor-patient-meta">
                        {profile?.age}y · {profile?.gender} · {profile?.bloodGroup}
                      </p>
                      <p className="doctor-patient-owner">
                        Shared by {item.ownerUserId?.fullName}
                      </p>
                    </div>
                    <div className="doctor-patient-badges">
                      <span className={`badge ${item.accessType === 'upload' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: 10 }}>
                        {item.accessType === 'upload' ? <><Upload size={9} /> Upload</> : <><Eye size={9} /> View</>}
                      </span>
                      <div className="doctor-patient-expiry">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(item.expiryDate), { addSuffix: true })}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: detail panel ────────────────────────────────────────── */}
        <div className="doctor-detail">
          {!selected ? (
            <div className="empty-state card" style={{ padding: '80px 20px' }}>
              <Stethoscope size={52} />
              <h3>Select a patient</h3>
              <p>Choose a shared profile from the list to view their medical timeline</p>
            </div>
          ) : detailLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <div className="spinner" />
            </div>
          ) : profileData ? (
            <ProfileDetail
              profileData={profileData}
              summary={summary}
              summaryTab={summaryTab}
              setSummaryTab={setSummaryTab}
            />
          ) : (
            <div className="empty-state card" style={{ padding: '60px 20px' }}>
              <AlertCircle size={40} />
              <h3>Failed to load</h3>
              <p>Could not load this patient's records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Profile detail panel ─────────────────────────────────────────────────────
const ProfileDetail = ({ profileData, summary, summaryTab, setSummaryTab }) => {
  const { profile, records, accessType, expiryDate } = profileData;

  return (
    <div className="doctor-detail-inner">
      {/* Patient header card */}
      <div className="card doctor-patient-header">
        <Avatar name={profile?.profileName} size={56} />
        <div style={{ flex: 1 }}>
          <h2 className="doctor-patient-header__name">{profile?.profileName}</h2>
          {profile?.actualName && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile.actualName}</p>
          )}
          <div className="doctor-patient-header__meta">
            <span><User size={13} /> {profile?.age} years</span>
            <span><Activity size={13} /> {profile?.gender}</span>
            <span style={{ color: '#ef4444' }}>Blood: {profile?.bloodGroup}</span>
            {profile?.allergies?.length > 0 && (
              <span style={{ color: '#d97706' }}>
                Allergies: {profile.allergies.join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="doctor-patient-header__access">
          <div className="doctor-access-badge">
            {accessType === 'upload'
              ? <><Upload size={13} /> Upload Access</>
              : <><Shield size={13} /> View Only</>}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Expires {formatDistanceToNow(new Date(expiryDate), { addSuffix: true })}
          </p>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>
            {records?.length || 0} records
          </p>
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="card doctor-ai-card">
          <div className="doctor-ai-header">
            <div className="doctor-ai-icon"><Brain size={20} /></div>
            <div style={{ flex: 1 }}>
              <h3>AI Health Summary</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Generated from {summary.totalVisits} records
              </p>
            </div>
            {/* Summary type tabs */}
            <div className="doctor-summary-tabs">
              <button
                className={`doctor-summary-tab ${summaryTab === 'patient' ? 'doctor-summary-tab--active' : ''}`}
                onClick={() => setSummaryTab('patient')}>
                <User size={12} /> Patient
              </button>
              <button
                className={`doctor-summary-tab ${summaryTab === 'doctor' ? 'doctor-summary-tab--active' : ''}`}
                onClick={() => setSummaryTab('doctor')}>
                <Stethoscope size={12} /> Clinical
              </button>
            </div>
          </div>

          <div className={`doctor-summary-box ${summaryTab === 'doctor' ? 'doctor-summary-box--clinical' : ''}`}>
            <p>{summaryTab === 'doctor' ? summary.doctorSummary : summary.patientSummary}</p>
          </div>

          {summary.frequentDiagnoses?.length > 0 && (
            <div className="doctor-ai-section">
              <p className="doctor-ai-section-label">Frequent Diagnoses</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {summary.frequentDiagnoses.map((d) => (
                  <span key={d.name} className="badge badge-blue">{d.name} ({d.count}×)</span>
                ))}
              </div>
            </div>
          )}

          {summary.currentMedications?.length > 0 && (
            <div className="doctor-ai-section">
              <p className="doctor-ai-section-label">Common Medications</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {summary.currentMedications.slice(0, 6).map((m) => (
                  <span key={m.name} className="badge badge-purple">{m.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medical timeline */}
      <div className="doctor-timeline-header">
        <h3>Medical Timeline</h3>
        <span className="badge badge-gray">{records?.length} records</span>
      </div>

      {records?.length === 0 ? (
        <div className="empty-state card" style={{ padding: '40px 20px' }}>
          <FileText size={36} />
          <h3>No records</h3>
          <p>This patient has no medical records yet</p>
        </div>
      ) : (
        <div className="doctor-records">
          {records.map((record) => {
            const color = TYPE_COLORS[record.recordType] || '#64748b';
            return (
              <div key={record._id} className="doctor-record card">
                <div className="doctor-record__left">
                  <div className="doctor-record__type-dot" style={{ background: color }} />
                  <div className="doctor-record__icon" style={{ background: color + '18', color }}>
                    <FileText size={18} />
                  </div>
                </div>
                <div className="doctor-record__body">
                  <div className="doctor-record__top">
                    <h4 className="doctor-record__title">
                      {record.diagnosis || record.recordType || 'Medical Record'}
                    </h4>
                    <span className="badge" style={{ background: color + '18', color, fontSize: 11 }}>
                      {record.recordType}
                    </span>
                  </div>
                  <div className="doctor-record__meta">
                    {record.doctorName && (
                      <span><User size={11} /> Dr. {record.doctorName}</span>
                    )}
                    {record.hospitalName && (
                      <span><Building2 size={11} /> {record.hospitalName}</span>
                    )}
                    {record.visitDate && (
                      <span><Calendar size={11} /> {format(new Date(record.visitDate), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                  {record.medicines?.length > 0 && (
                    <div className="doctor-record__medicines">
                      <Pill size={11} />
                      {record.medicines.slice(0, 4).map((m, i) => (
                        <span key={i} className="badge badge-gray" style={{ fontSize: 11 }}>{m.name}</span>
                      ))}
                      {record.medicines.length > 4 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{record.medicines.length - 4}</span>
                      )}
                    </div>
                  )}
                  {record.notes && (
                    <p className="doctor-record__notes">{record.notes.substring(0, 120)}{record.notes.length > 120 ? '...' : ''}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
