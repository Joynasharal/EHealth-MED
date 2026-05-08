import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Heart, ArrowRight, FileText, Users, Cpu } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Auth.css';
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      // Shake animation on wrong credentials
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  // useGoogleLogin with auth-code flow: opens popup, gets access token,
  // then we fetch the user info from Google and send to our backend
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        // Fetch user info from Google using the access token
        const userInfo = await api.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` }, baseURL: '' }
        );
        const { sub, email, name, picture } = userInfo.data;
        // Send to our backend as a synthetic credential object
        await googleLogin(null, 'patient', { sub, email, name, picture });
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
      setGoogleLoading(false);
    },
    flow: 'implicit',
  });

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-panel auth-panel--left">
        <div className="auth-panel__content">
          <div className="auth-brand">
            <div className="auth-brand__icon">
              <Heart size={28} fill="white" color="white" />
            </div>
            <h1 className="auth-brand__name">Health Record Manager</h1>
          </div>
          <h2 className="auth-panel__title">Your health records, all in one place</h2>
          <p className="auth-panel__desc">
            Securely manage medical records for your entire family. AI-powered OCR extracts information automatically from prescriptions and reports.
          </p>
          <div className="auth-features">
            {[
              'AI-powered OCR extraction',
              'Family profile management',
              'Secure doctor sharing',
              'Health analytics & insights',
            ].map((f) => (
              <div key={f} className="auth-feature">
                <div className="auth-feature__dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="auth-panel__illustration">
            <div className="auth-illustration">
              <div className="auth-illustration__card auth-illustration__card--1">
                <div className="auth-illustration__icon"><FileText size={22} strokeWidth={1.5} /></div>
                <div>
                  <p className="auth-illustration__label">Total Records</p>
                  <p className="auth-illustration__value">248</p>
                </div>
              </div>
              <div className="auth-illustration__card auth-illustration__card--2">
                <div className="auth-illustration__icon"><Users size={22} strokeWidth={1.5} /></div>
                <div>
                  <p className="auth-illustration__label">Family Profiles</p>
                  <p className="auth-illustration__value">4 Members</p>
                </div>
              </div>
              <div className="auth-illustration__card auth-illustration__card--3">
                <div className="auth-illustration__icon"><Cpu size={22} strokeWidth={1.5} /></div>
                <div>
                  <p className="auth-illustration__label">AI Processed</p>
                  <p className="auth-illustration__value">98% Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* Custom Google button — consistent with form styling */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading}
          >
            {googleLoading
              ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : <GoogleIcon />}
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider"><span>or sign in with email</span></div>

          <form onSubmit={handleSubmit} className={`auth-form ${shake ? 'auth-form--shake' : ''}`}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input type="email" className="form-input auth-input" placeholder="you@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input type={showPass ? 'text' : 'password'} className="form-input auth-input"
                  placeholder="Enter your password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-form-options">
              <label className="auth-remember"><input type="checkbox" /> Remember me</label>
              <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading
                ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
