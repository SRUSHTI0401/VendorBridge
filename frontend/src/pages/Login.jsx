import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await loginUser(form);
      login({ full_name: res.data.full_name, role: res.data.role, id: res.data.user_id }, res.data.access_token);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Screen label */}
        <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:11, marginBottom:16, letterSpacing:'0.5px' }}>
          Login Screen &nbsp;(Screen 1)
        </div>
        <div className="auth-box">
          {/* Photo placeholder */}
          <div className="auth-photo">
            <span>Photo</span>
          </div>

          {err && <div className="alert alert-err">{err}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <input
                className="field-input"
                placeholder="Username"
                type="email"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                required
              />
            </div>
            <div className="field">
              <input
                className="field-input"
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
            </div>
            <button className="btn btn-outline btn-full" style={{ marginTop: 8 }} disabled={loading}>
              Login Button
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--text-muted)' }}>
            No account? <Link to="/register" style={{ color:'var(--green)' }}>Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
