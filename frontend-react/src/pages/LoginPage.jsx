import React from 'react';

export default function LoginPage({ onLogin }) {
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
          <label className="form-label">Email address</label>
          <input className="form-input" type="email" id="login-email" placeholder="you@iaa.de" defaultValue="user@iaa.de" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" id="login-password" placeholder="••••••••" defaultValue="••••••••" />
        </div>
        <button className="login-btn" onClick={() => onLogin('user')} style={{marginTop:"10px", background:"linear-gradient(135deg, var(--blue), var(--purple))"}}><span className="role-icon">👤</span> Login as User</button>
        <button className="login-btn" onClick={() => onLogin('admin')} style={{marginTop:"12px", background:"linear-gradient(135deg, var(--rose), var(--orange))"}}><span className="role-icon">🛡️</span> Login as Admin</button>
      </div>
    </div>
  );
}
