import React, { useState } from 'react';
import { toast } from '../utils/toast';

export default function RegisterPage({ onNavigate }) {
  const [formData, setFormData] = useState({
    identifier: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    const host = window.location.hostname || 'localhost';
    try {
      const response = await fetch(`http://${host}:8000/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.identifier.trim(),
          full_name: formData.fullName.trim() || formData.identifier.trim(),
          password: formData.password,
          role: 'viewer'
        })
      });

      if (response.ok) {
        toast('Account successfully created! You can now log in.');
        onNavigate('login');
      } else {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = typeof errData.detail === 'string'
          ? errData.detail
          : (Array.isArray(errData.detail) ? errData.detail.map(d => d.msg).join('; ') : 'Registration failed.');
        toast(errorMsg, 'error');
      }
    } catch (err) {
      console.warn('Backend registration failed:', err);
      toast('Backend service unreachable. Please ensure the server is running.', 'error');
    } finally {
      setIsLoading(false);
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

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">User ID or Email</label>
            <input 
              className="form-input" 
              type="text" 
              name="identifier" 
              placeholder="e.g., testuser or test@iaa.de" 
              value={formData.identifier} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="form-input" 
              type="text" 
              name="fullName" 
              placeholder="e.g., John Doe" 
              value={formData.fullName} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password (min 6 characters)</label>
            <input 
              className="form-input" 
              type="password" 
              name="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              className="form-input" 
              type="password" 
              name="confirmPassword" 
              placeholder="••••••••" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button 
            type="submit" 
            className="login-btn" 
            disabled={isLoading}
            style={{marginTop:"10px", background:"linear-gradient(135deg, var(--blue), var(--purple))", opacity: isLoading ? 0.7 : 1}}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
