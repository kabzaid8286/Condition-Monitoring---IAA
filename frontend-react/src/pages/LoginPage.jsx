import React, { useState } from 'react';
import { toast } from '../utils/toast';

export default function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleAuth = (e) => {
    e.preventDefault();
    // Temporary mock logic for frontend until we connect FastAPI
    if (credentials.id === 'admin' && credentials.password === 'admin123') {
      onLogin('admin');
    } else if (credentials.id === 'user' && credentials.password === 'user123') {
      onLogin('user');
    } else {
      toast('Invalid ID or Password. Try admin/admin123 or user/user123', 'error');
    }
  };

  return (
    <div id="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src="https://www.hs-aalen.de/_assets/23c048c4e278024490c6ac1b855e5de4/img/hs-aalen-logo.svg" alt="HS Aalen" style={{height: "40px", borderRadius: "4px"}} />
          <div>
            <div className="login-logo-text">IAA Condition Monitor</div>
            <div className="login-logo-sub">Industrial Analytics &amp; Automation</div>
          </div>
        </div>
        <div className="login-title">Access Gateway</div>
        <div className="login-subtitle">Sign in to access the monitoring dashboard</div>
        <div className="form-group">
          <label className="form-label">User ID</label>
          <input 
            className="form-input" 
            type="text" 
            name="id" 
            placeholder="Enter ID (e.g., admin)" 
            value={credentials.id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            className="form-input" 
            type="password" 
            name="password" 
            placeholder="••••••••" 
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>
        <button className="login-btn" onClick={() => onLogin('user')} style={{marginTop:"10px", background:"linear-gradient(135deg, var(--blue), var(--purple))"}}>
          <span className="role-icon">👤</span> Login as User
        </button>
        <button className="login-btn" onClick={() => onLogin('admin')} style={{marginTop:"12px", background:"linear-gradient(135deg, var(--rose), var(--orange))"}}>
          <span className="role-icon">🛡️</span> Login as Admin
        </button>

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', fontSize: '13px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); toast('Password reset link sent to your email.'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot Password?</a>
          <a href="#" onClick={(e) => { e.preventDefault(); toast('Account creation is restricted to administrators.'); }} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>Create an account</a>
        </div>
      </div>
    </div>
  );
}
