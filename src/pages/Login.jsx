import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { FJLogo } from '../components/Shared.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = login(email.trim(), password);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    if (result.user.mustChangePassword) { navigate('/change-password'); return; }
    navigate('/breakfast');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
            <FJLogo size={48} color="#1B361D"/>
          </div>
          <div className="login-logo-text">FARMER J</div>
          <div className="login-logo-sub">Production Planning</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              className="fj-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@farmerj.com"
              autoFocus
              required
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              className="fj-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="login-error">⚠ {error}</div>}
          <button
            className="btn btn-primary w-full mt-4"
            type="submit"
            disabled={loading}
            style={{justifyContent:'center',marginTop:20}}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{marginTop:20,padding:'12px',background:'var(--surface-2)',borderRadius:'var(--r)',fontSize:11,color:'var(--text-muted)'}}>
          <strong>Demo logins:</strong><br/>
          jana@farmej.com / FarmerJ2026!<br/>
          manager.holborn@farmerj.com / FarmerJ2026!
        </div>
      </div>
    </div>
  );
}

export function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    changePassword(password);
    navigate('/breakfast');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <FJLogo size={40} color="#1B361D"/>
          <div className="login-logo-text" style={{marginTop:8}}>Set New Password</div>
          <div className="login-logo-sub">Please set a new password to continue</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">New Password</label>
            <input className="fj-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required/>
          </div>
          <div className="login-field">
            <label className="login-label">Confirm Password</label>
            <input className="fj-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required/>
          </div>
          {error && <div className="login-error">⚠ {error}</div>}
          <button className="btn btn-primary w-full" type="submit" style={{justifyContent:'center',marginTop:16}}>Set Password</button>
        </form>
      </div>
    </div>
  );
}
