import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Droplets, Users, X, Save } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './FamilyProfiles.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const RELATIONSHIPS = ['Self', 'Mom', 'Dad', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777'];

const getColor = (name) => AVATAR_COLORS[name?.charCodeAt(0) % AVATAR_COLORS.length] || '#2563eb';

const emptyForm = { profileName: '', age: '', gender: 'Male', bloodGroup: 'Unknown', relationship: 'Self', dateOfBirth: '', allergies: '', chronicConditions: '' };

const ProfileModal = ({ profile, onClose, onSave }) => {
  const [form, setForm] = useState(profile ? {
    ...profile,
    allergies: profile.allergies?.join(', ') || '',
    chronicConditions: profile.chronicConditions?.join(', ') || '',
  } : emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      let data;
      if (profile) {
        const res = await api.put(`/profiles/${profile._id}`, payload);
        data = res.data.profile;
        toast.success('Profile updated');
      } else {
        const res = await api.post('/profiles', payload);
        data = res.data.profile;
        toast.success('Profile created');
      }
      onSave(data, !!profile);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{profile ? 'Edit Profile' : 'Add Family Profile'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal__body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="e.g. John Doe" value={form.profileName}
                onChange={(e) => setForm({ ...form, profileName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input type="number" className="form-input" placeholder="Age" min="0" max="150" value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-input" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Relationship *</label>
              <select className="form-input" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                {RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Allergies (comma separated)</label>
            <input className="form-input" placeholder="e.g. Penicillin, Peanuts" value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Chronic Conditions (comma separated)</label>
            <input className="form-input" placeholder="e.g. Diabetes, Hypertension" value={form.chronicConditions}
              onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} />
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FamilyProfiles = () => {
  const { profiles, activeProfile, switchProfile, addProfile, updateProfileInList, removeProfile } = useProfile();
  const [modal, setModal] = useState(null); // null | 'add' | profile object
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (profile) => {
    if (!window.confirm(`Delete ${profile.profileName}'s profile? All records will be preserved.`)) return;
    setDeleting(profile._id);
    try {
      await api.delete(`/profiles/${profile._id}`);
      removeProfile(profile._id);
      toast.success('Profile deleted');
    } catch {
      toast.error('Failed to delete profile');
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = (profile, isEdit) => {
    if (isEdit) updateProfileInList(profile);
    else addProfile(profile);
  };

  return (
    <div className="profiles-page fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Family Profiles</h1>
          <p>Manage health records for all your family members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-state card" style={{ padding: '80px 20px' }}>
          <Users size={56} />
          <h3>No profiles yet</h3>
          <p>Add your first family member to start managing their health records</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setModal('add')}>
            <Plus size={16} /> Add First Profile
          </button>
        </div>
      ) : (
        <div className="profiles-grid">
          {profiles.map((profile) => (
            <div key={profile._id} className={`profile-card card ${activeProfile?._id === profile._id ? 'profile-card--active' : ''}`}>
              <div className="profile-card__top">
                <div className="profile-card__avatar" style={{ background: getColor(profile.profileName) }}>
                  {profile.profileName[0].toUpperCase()}
                </div>
                {activeProfile?._id === profile._id && (
                  <span className="badge badge-blue profile-card__active-badge">Active</span>
                )}
              </div>

              <h3 className="profile-card__name">{profile.profileName}</h3>
              <p className="profile-card__relation">{profile.relationship}</p>

              <div className="profile-card__stats">
                <div className="profile-card__stat">
                  <User size={13} />
                  <span>{profile.age} years · {profile.gender}</span>
                </div>
                <div className="profile-card__stat">
                  <Droplets size={13} />
                  <span>{profile.bloodGroup}</span>
                </div>
              </div>

              {profile.allergies?.length > 0 && (
                <div className="profile-card__tags">
                  {profile.allergies.slice(0, 2).map((a) => (
                    <span key={a} className="badge badge-red" style={{ fontSize: 11 }}>{a}</span>
                  ))}
                </div>
              )}

              {profile.chronicConditions?.length > 0 && (
                <div className="profile-card__tags">
                  {profile.chronicConditions.slice(0, 2).map((c) => (
                    <span key={c} className="badge badge-yellow" style={{ fontSize: 11 }}>{c}</span>
                  ))}
                </div>
              )}

              <div className="profile-card__actions">
                <button className="btn btn-secondary btn-sm" onClick={() => switchProfile(profile)}>
                  {activeProfile?._id === profile._id ? 'Selected' : 'Select'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(profile)}>
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(profile)}
                  disabled={deleting === profile._id}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button className="profile-card profile-card--add card" onClick={() => setModal('add')}>
            <div className="profile-card__add-icon">
              <Plus size={28} />
            </div>
            <p className="profile-card__add-text">Add Family Member</p>
          </button>
        </div>
      )}

      {modal && (
        <ProfileModal
          profile={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default FamilyProfiles;
