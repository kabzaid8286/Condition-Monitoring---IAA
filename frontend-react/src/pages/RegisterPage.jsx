import React, { useState } from 'react';
import { toast } from '../utils/toast';

export default function RegisterPage({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }
    // Simulate sending OTP
    toast('OTP sent to your email.');
    setStep(2);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (formData.otp.length >= 4) {
      toast('Account created successfully!');
      onNavigate('login');
    } else {
      toast('Invalid OTP.', 'error');
    }
  };

  return (
    <div id="login-screen">
      <div className="login-card">
        <div className="login-logo" style={{ cursor: 'pointer' }} onClick={() => onNavigate('login')}>
          <img src="https://www.hs-aalen.de/_assets/23c048c4e278024490c6ac1b855e5de4/img/hs-aalen-logo.svg" alt="HS Aalen" style={{height: "40px", borderRadius: "4px"}} />
          <div>
            <div className="login-logo-text">IAA Condition Monitor</div>
            <div className="login-logo-sub">Create New Account</div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" name="email" placeholder="you@iaa.de" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" type="text" name="username" placeholder="Enter username" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
            <button type="submit" className="login-btn" style={{marginTop:"10px", background:"linear-gradient(135deg, var(--blue), var(--purple))"}}>
              Create Account
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="login-title" style={{ marginTop: '10px', fontSize: '18px' }}>Verify your Email</div>
            <div className="login-subtitle">We sent a verification code to {formData.email}</div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Enter OTP</label>
              <input className="form-input" type="text" name="otp" placeholder="1234" value={formData.otp} onChange={handleChange} required style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }} />
            </div>
            <button type="submit" className="login-btn" style={{marginTop:"10px", background:"linear-gradient(135deg, var(--green), var(--teal))"}}>
              Verify and Login
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
