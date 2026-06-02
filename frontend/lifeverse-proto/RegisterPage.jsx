
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', password:'', fullName:'', educationLevel:'secondary' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await register(form); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{width:'100%',maxWidth:420}}>
        <Link to="/" style={{display:'flex',alignItems:'center',gap:10,justifyContent:'center',marginBottom:40,textDecoration:'none',color:'white'}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center'}}><Zap size={17} color="white"/></div>
          <span style={{fontWeight:700,fontSize:22}}>Lifeverse</span>
        </Link>
        <div className="card glass-strong">
          <h2 style={{fontWeight:800,fontSize:24,marginBottom:4}}>Begin your journey</h2>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:14,marginBottom:24}}>Create your free account</p>
          {error && <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',fontSize:13,marginBottom:20}}><AlertCircle size={15}/>{error}</div>}
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label className="label">Full name</label>
                <input className="input" placeholder="Alex Johnson" value={form.fullName} onChange={set('fullName')}/>
              </div>
              <div>
                <label className="label">Username</label>
                <input className="input" placeholder="alexj" value={form.username} onChange={set('username')} required minLength={3}/>
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div style={{position:'relative'}}>
                <Mail size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)'}}/>
                <input type="email" className="input" style={{paddingLeft:38}} placeholder="you@school.com" value={form.email} onChange={set('email')} required/>
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{position:'relative'}}>
                <Lock size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)'}}/>
                <input type="password" className="input" style={{paddingLeft:38}} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6}/>
              </div>
            </div>
            <div>
              <label className="label">Education level</label>
              <select className="input" style={{cursor:'pointer'}} value={form.educationLevel} onChange={set('educationLevel')}>
                <option value="primary">Primary school</option>
                <option value="secondary">Secondary school</option>
                <option value="highschool">High school</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="postgraduate">Postgraduate</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{marginTop:4}}>
              {loading ? <span style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/> : 'Create account'}
            </button>
          </form>
          <p style={{textAlign:'center',fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:20}}>
            Already have an account? <Link to="/login" style={{color:'#60a5fa',textDecoration:'none',fontWeight:600}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}