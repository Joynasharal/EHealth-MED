import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Lock, Eye, EyeOff, CheckCircle, RefreshCw, Heart } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Auth.css';
import './ForgotPassword.css';

// ─── Step indicator ───────────────────────────────────────────────────────────
const Steps = ({ current }) => {
  const steps = ['Enter Email', 'Verify OTP', 'New Password'];
  return (
    <div className="fp-steps">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`fp-step ${i < current ? 'fp-step--done' : i === current ? 'fp-step--active' : ''}`}>
            <div className="fp-step__num">
              {i < current ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`fp-step__line ${i < current ? 'fp-step__line--done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── OTP input — 6 individual boxes ──────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, i) => (i === idx ? '' : d)).join('');
      onChange(next);
      if (idx > 0) inputs.current[idx - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) { inputs.current[idx - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && idx < 5) { inputs.current[idx + 1]?.focus(); return; }
  };

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const next = digits.map((d, i) => (i === idx ? char : d)).join('');
    onChange(next);
    if (idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted.padEnd(6, '').slice(0, 6)); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="otp-input-row">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          className={`otp-box ${d ? 'otp-box--filled' : ''}`}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=newpass, 3=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 0: Send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      // Dev mode: show OTP in toast
      if (data.devOtp) {
        toast(`Dev mode OTP: ${data.devOtp}`, { duration: 30000, icon: '🔑' });
      } else {
        toast.success('OTP sent to your email');
      }
      setStep(1);
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setResetToken(data.resetToken);
      setStep(2);
      toast.success('OTP verified');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, resetToken, newPassword });
      setStep(3);
      toast.success('Password reset successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setOtp('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.devOtp) toast(`Dev mode OTP: ${data.devOtp}`, { duration: 30000, icon: '🔑' });
      else toast.success('New OTP sent');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-panel auth-panel--left">
        <div className="auth-panel__content">
          <div className="auth-brand">
            <div className="auth-brand__icon"><Heart size={28} fill="white" color="white" /></div>
            <h1 className="auth-brand__name">Health Record Manager</h1>
          </div>
          <h2 className="auth-panel__title">Reset your password</h2>
          <p className="auth-panel__desc">
            Enter your registered email address and we'll send you a one-time password to reset your account.
          </p>
          <div className="auth-features">
            {['Secure OTP verification', '10-minute expiry for safety', 'Instant email delivery', 'No account lockout'].map((f) => (
              <div key={f} className="auth-feature">
                <div className="auth-feature__dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-container">
          {step < 3 && (
            <Link to="/login" className="fp-back-link">
              <ArrowLeft size={15} /> Back to Sign In
            </Link>
          )}

          <div className="auth-form-header">
            <h2>
              {step === 0 && 'Forgot Password'}
              {step === 1 && 'Enter OTP'}
              {step === 2 && 'New Password'}
              {step === 3 && 'Password Reset'}
            </h2>
            <p>
              {step === 0 && "We'll send a 6-digit OTP to your email"}
              {step === 1 && `OTP sent to ${email}`}
              {step === 2 && 'Choose a strong new password'}
              {step === 3 && 'Your password has been updated'}
            </p>
          </div>

          {step < 3 && <Steps current={step} />}

          {error && <div className="auth-error">{error}</div>}

          {/* ── Step 0: Email ─────────────────────────────────────────────── */}
          {step === 0 && (
            <form onSubmit={handleSendOTP} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input type="email" className="form-input auth-input"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                {loading
                  ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  : <>Send OTP <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* ── Step 1: OTP ───────────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleVerifyOTP} className="auth-form">
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                  Enter the 6-digit code
                </label>
                <OTPInput value={otp} onChange={setOtp} />
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-submit"
                disabled={loading || otp.length < 6}>
                {loading
                  ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  : <>Verify OTP <ArrowRight size={18} /></>}
              </button>

              <div className="fp-resend">
                {resendTimer > 0 ? (
                  <p>Resend OTP in <strong>{resendTimer}s</strong></p>
                ) : (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleResend} disabled={loading}>
                    <RefreshCw size={13} /> Resend OTP
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStep(0); setOtp(''); setError(''); }}>
                  Change email
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: New Password ──────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input type={showPass ? 'text' : 'password'} className="form-input auth-input"
                    placeholder="Minimum 6 characters"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <button type="button" className="auth-input-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input type="password" className="form-input auth-input"
                    placeholder="Repeat your new password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="fp-strength">
                  <div className="fp-strength__bar">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`fp-strength__seg ${getStrength(newPassword) >= i ? `fp-strength__seg--${getStrengthLabel(newPassword)}` : ''}`} />
                    ))}
                  </div>
                  <span className={`fp-strength__label fp-strength__label--${getStrengthLabel(newPassword)}`}>
                    {getStrengthLabel(newPassword)}
                  </span>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                {loading
                  ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  : <>Reset Password <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* ── Step 3: Success ───────────────────────────────────────────── */}
          {step === 3 && (
            <div className="fp-success">
              <div className="fp-success__icon">
                <CheckCircle size={48} />
              </div>
              <h3>Password Updated</h3>
              <p>Your password has been reset successfully. You can now sign in with your new password.</p>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={() => navigate('/login')}>
                Sign In Now <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 0 && (
            <p className="auth-switch">
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Password strength helpers ────────────────────────────────────────────────
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};
const getStrengthLabel = (pwd) => {
  const s = getStrength(pwd);
  return s <= 1 ? 'weak' : s === 2 ? 'fair' : s === 3 ? 'good' : 'strong';
};

export default ForgotPassword;
