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
      <form className="login-card" onSubmit={handleAuth}>
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
        <button type="submit" className="login-btn" style={{marginTop:"10px", background:"linear-gradient(135deg, var(--blue), var(--purple))"}}>
          Sign In
        </button>
      </form>
    </div>
  );
}
