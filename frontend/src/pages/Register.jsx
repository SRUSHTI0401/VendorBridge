import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api';

export default function Register() {
  const [form, setForm] = useState({
    first_name:'', last_name:'', email:'', phone:'',
    password:'', role:'procurement_officer', country:'', additional_info:''
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await registerUser(form);
      navigate('/login');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div style={{ width:'100%', maxWidth: 520 }}>
        <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:11, marginBottom:16, letterSpacing:'0.5px' }}>
          Registration Screen &nbsp;(Screen 2)
        </div>
        <div className="auth-box" style={{ maxWidth:520 }}>
          {/* Photo */}
          <div className="auth-photo">
            <span>Photo</span>
          </div>

          {err && <div className="alert alert-err">{err}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row-2">
              <div className="field">
                <input className="field-input" placeholder="First Name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} required />
              </div>
              <div className="field">
                <input className="field-input" placeholder="Last Name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} required />
              </div>
            </div>
            <div className="row-2">
              <div className="field">
                <input className="field-input" placeholder="Email Address" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
              </div>
              <div className="field">
                <input className="field-input" placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
              </div>
            </div>
            <div className="row-2">
              <div className="field">
                <select className="field-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="procurement_officer">Role (Admin, officer)</option>
                  <option value="procurement_officer">Procurement Officer</option>
                  <option value="manager">Manager / Approver</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="field">
                <input className="field-input" placeholder="Country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} />
              </div>
            </div>
            <div className="field">
              <input className="field-input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
            </div>
            <div className="field">
              <textarea
                className="field-textarea"
                placeholder="Additional Information ...."
                value={form.additional_info}
                onChange={e=>setForm({...form,additional_info:e.target.value})}
              />
            </div>
            <button className="btn btn-outline btn-full" disabled={loading}>
              Register
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'var(--text-muted)' }}>
            Have an account? <Link to="/login" style={{ color:'var(--green)' }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
