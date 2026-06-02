// frontend/src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, AlertCircle, Building, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Kenyan curriculum education levels
const educationLevels = [
  'Pre-Primary (PP1-PP2)',
  'Primary (Grade 1-8)',
  'Junior Secondary (Grade 7-9)',
  'Senior Secondary (Grade 10-12)',
  'University (Undergraduate)',
  'University (Postgraduate)',
  'TVET / Vocational',
  'Adult Education',
];

// Example courses for University and TVET – you can expand or fetch from API
const universityCourses = [
  'Computer Science',
  'Information Technology',
  'Business Administration',
  'Economics',
  'Engineering (Civil, Mechanical, Electrical)',
  'Medicine',
  'Law',
  'Education',
  'Psychology',
  'International Relations',
];

const tvetCourses = [
  'Electrical Engineering',
  'Mechanical Engineering',
  'ICT / Computing',
  'Hospitality Management',
  'Automotive Technology',
  'Fashion Design',
  'Building Technology',
  'Agriculture',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    educationLevel: educationLevels[0],
    institution: '',
    course: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const showCourse = form.educationLevel === 'University (Undergraduate)' ||
                     form.educationLevel === 'University (Postgraduate)' ||
                     form.educationLevel === 'TVET / Vocational';

  let courseOptions = [];
  if (form.educationLevel.includes('University')) {
    courseOptions = universityCourses;
  } else if (form.educationLevel === 'TVET / Vocational') {
    courseOptions = tvetCourses;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form);
      // Redirect based on role (same as login)
      if (data.user.role === 'parent') {
        navigate('/parent-dashboard');
      } else if (data.user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="animated-bg" />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40, textDecoration: 'none', color: 'white' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={17} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 22 }}>Lifeverse</span>
          </Link>

          <div className="card glass-strong">
            <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>Begin your journey</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>Create your free account</p>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Full name</label>
                  <input className="input" placeholder="Alex Johnson" value={form.fullName} onChange={set('fullName')} required />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input className="input" placeholder="alexj" value={form.username} onChange={set('username')} required minLength={3} />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input type="email" className="input" style={{ paddingLeft: 38 }} placeholder="you@school.com" value={form.email} onChange={set('email')} required />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input type="password" className="input" style={{ paddingLeft: 38 }} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
                </div>
              </div>

              <div>
                <label className="label">Education level (Kenyan Curriculum)</label>
                <select className="input" style={{ cursor: 'pointer' }} value={form.educationLevel} onChange={set('educationLevel')} required>
                  {educationLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Institution / School</label>
                <div style={{ position: 'relative' }}>
                  <Building size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: 38 }}
                    placeholder="e.g., Strathmore University"
                    value={form.institution}
                    onChange={set('institution')}
                    required
                  />
                </div>
              </div>

              {showCourse && (
                <div>
                  <label className="label">Course / Program</label>
                  <div style={{ position: 'relative' }}>
                    <GraduationCap size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    {courseOptions.length > 0 ? (
                      <select className="input" style={{ paddingLeft: 38 }} value={form.course} onChange={set('course')} required>
                        <option value="">Select your course</option>
                        {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="input"
                        style={{ paddingLeft: 38 }}
                        placeholder="Enter your course"
                        value={form.course}
                        onChange={set('course')}
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Role</label>
                <div style={{ position: 'relative' }}>
                  <Users size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <select className="input" style={{ paddingLeft: 38 }} value={form.role} onChange={set('role')} required>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
                {loading ? (
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
              Already have an account? <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}