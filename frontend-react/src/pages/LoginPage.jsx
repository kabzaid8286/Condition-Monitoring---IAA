import React, { useState } from 'react';
import { toast } from '../utils/toast';

export default function LoginPage({ onLogin, onNavigate }) {
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const [isLoading, setIsLoading] = useState(false);

  const attemptLogin = async (requestedRole) => {
    if (!credentials.id || !credentials.password) {
      toast('Please enter both User ID and Password.', 'error');
      return;
    }

    setIsLoading(true);
    const host = window.location.hostname || 'localhost';

    try {
      const response = await fetch(`http://${host}:8000/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.id,
          password: credentials.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Strict role validation based on which button was clicked
        if (requestedRole === 'admin') {
          if (data.role !== 'admin') {
            toast('Access denied. Administrator privileges required to log in as Admin.', 'error');
            return;
          }
          if (data.access_token) {
            localStorage.setItem('auth_token', data.access_token);
          }
          onLogin('admin');
          return;
        } else {
          // requestedRole === 'user'
          if (data.role === 'admin') {
            toast('Administrator account detected. Please use the "Login as Admin" button.', 'info');
            return;
          }
          if (data.access_token) {
            localStorage.setItem('auth_token', data.access_token);
          }
          onLogin('user');
          return;
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        const errorMsg = typeof errJson.detail === 'string' 
          ? errJson.detail 
          : (Array.isArray(errJson.detail) ? errJson.detail.map(d => d.msg).join('; ') : 'Invalid credentials.');
        toast(errorMsg, 'error');
        return;
      }
    } catch (err) {
      console.warn('Backend auth unreachable, checking local credentials fallback:', err);
      const cleanId = (credentials.id || '').trim().toLowerCase();
      if (requestedRole === 'admin') {
        if (cleanId === 'admin' && credentials.password === 'admin123') {
          onLogin('admin');
        } else if (cleanId === 'user') {
          toast('Access denied. Administrator privileges required to log in as Admin.', 'error');
        } else {
          toast('Invalid administrator credentials or backend unavailable.', 'error');
        }
      } else {
        // requestedRole === 'user'
        if (cleanId === 'admin') {
          toast('Administrator account detected. Please use the "Login as Admin" button.', 'info');
        } else if (cleanId === 'user' && credentials.password === 'user123') {
          onLogin('user');
        } else {
          toast('Invalid user credentials or backend unavailable.', 'error');
        }
      }
    } finally {
      setIsLoading(false);
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
        <button className="login-btn" onClick={(e) => { e.preventDefault(); attemptLogin('user'); }} style={{marginTop:"10px", background:"linear-gradient(135deg, var(--blue), var(--purple))"}}>
          Login as User
        </button>
        <button className="login-btn" onClick={(e) => { e.preventDefault(); attemptLogin('admin'); }} style={{marginTop:"12px", background:"linear-gradient(135deg, var(--rose), var(--orange))"}}>
          Login as Admin
        </button>

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', fontSize: '13px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('forgot-password'); }} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot Password?</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('register'); }} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>Create an account</a>
        </div>
      </div>
    </div>
  );
}
