import React, { useState } from 'react';
import { toast } from '../utils/toast';

export default function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      toast('Password reset link sent to your email.');
    }
  };

  return (
    <div id="login-screen">
      <div className="login-card">
        <div className="login-logo" style={{ cursor: 'pointer' }} onClick={() => onNavigate('login')}>
          <img src="https://www.hs-aalen.de/_assets/23c048c4e278024490c6ac1b855e5de4/img/hs-aalen-logo.svg" alt="HS Aalen" style={{height: "40px", borderRadius: "4px"}} />
          <div>
            <div className="login-logo-text">IAA Condition Monitor</div>
            <div className="login-logo-sub">Account Recovery</div>
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="login-title" style={{ marginTop: '10px', fontSize: '18px' }}>Reset Password</div>
            <div className="login-subtitle">Enter your email to receive a secure reset link.</div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Email address</label>
              <input 
                className="form-input" 
                type="email" 
                placeholder="you@iaa.de" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <button type="submit" className="login-btn" style={{marginTop:"10px", background:"linear-gradient(135deg, var(--rose), var(--orange))"}}>
              Send Reset Link
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>✉️</div>
            <div className="login-title" style={{ fontSize: '18px' }}>Check your Email</div>
            <div className="login-subtitle">If {email} exists in our system, you will receive a password reset link shortly.</div>
          </div>
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
