import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, AlertCircle, Building, GraduationCap, Users, Eye, EyeOff, Plus, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { api } from '../services/api'; // ← needed for verify/resend

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

// Example courses for University and TVET
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
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    dateOfBirth: '',
    educationLevel: educationLevels[0],
    institution: '',
    course: '',
    role: 'student',
    teacherCourses: [],
    parentSchools: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Verification states ──────────────────────────────────────
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [newCourse, setNewCourse] = useState('');
  const [newSchool, setNewSchool] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setForm(prev => ({
      ...prev,
      role,
      teacherCourses: [],
      parentSchools: [],
    }));
    setNewCourse('');
    setNewSchool('');
  };

  const handleAddCourse = () => {
    if (newCourse.trim() && !form.teacherCourses.includes(newCourse.trim())) {
      setForm(prev => ({
        ...prev,
        teacherCourses: [...prev.teacherCourses, newCourse.trim()],
      }));
      setNewCourse('');
    }
  };

  const handleRemoveCourse = (course) => {
    setForm(prev => ({
      ...prev,
      teacherCourses: prev.teacherCourses.filter(c => c !== course),
    }));
  };

  const handleAddSchool = () => {
    if (newSchool.trim() && !form.parentSchools.includes(newSchool.trim())) {
      setForm(prev => ({
        ...prev,
        parentSchools: [...prev.parentSchools, newSchool.trim()],
      }));
      setNewSchool('');
    }
  };

  const handleRemoveSchool = (school) => {
    setForm(prev => ({
      ...prev,
      parentSchools: prev.parentSchools.filter(s => s !== school),
    }));
  };

  const showCourse = form.educationLevel === 'University (Undergraduate)' ||
                     form.educationLevel === 'University (Postgraduate)' ||
                     form.educationLevel === 'TVET / Vocational';

  let courseOptions = [];
  if (form.educationLevel.includes('University')) {
    courseOptions = universityCourses;
  } else if (form.educationLevel === 'TVET / Vocational') {
    courseOptions = tvetCourses;
  }

  // ─── Registration submission ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.username || !form.email || !form.password || !form.fullName || !form.institution || !form.dateOfBirth) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (form.role === 'teacher' && form.teacherCourses.length === 0) {
      setError('Please add at least one course you teach');
      setLoading(false);
      return;
    }
    if (form.role === 'parent' && form.parentSchools.length === 0) {
      setError('Please add at least one school your child attends');
      setLoading(false);
      return;
    }

    const payload = {
      full_name: form.fullName,
      username: form.username,
      email: form.email,
      password: form.password,
      education_level: form.educationLevel,
      institution: form.institution,
      course: form.course,
      role: form.role,
      date_of_birth: form.dateOfBirth,
    };

    try {
      const data = await register(payload);
      // If the backend indicates verification is required
      if (data.requiresVerification) {
        setRegisteredEmail(data.email);
        setShowVerification(true);
        showToast('Verification code sent to your email.', 'success');
      } else {
        // Fallback (should not happen with new flow)
        showToast('Account created! Welcome to KUA 🎉', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify code ──────────────────────────────────────────────
  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Please enter the 6-digit code.', 'error');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const data = await api.verifyEmail(registeredEmail, verificationCode);
      // data contains token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Email verified! Welcome to KUA 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  // ─── Resend code ──────────────────────────────────────────────
  const handleResendCode = async () => {
    setResending(true);
    setError('');
    try {
      await api.resendVerification(registeredEmail);
      showToast('New verification code sent to your email.', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setResending(false);
    }
  };

  // ─── If verification step is active, show code input ──────────
  if (showVerification) {
    return (
      <div
        className="relative min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center py-12"
        style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        <div className="relative z-10 w-full max-w-md p-4">
          <div className="card glass-strong p-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={17} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>KUA</span>
            </div>

            <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
            <p className="text-white/60 text-sm mt-1">
              We sent a 6-digit code to <strong className="text-white/80">{registeredEmail}</strong>. Please enter it below.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-4">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="mt-4">
              <input
                type="text"
                maxLength={6}
                className="w-full input text-center text-2xl tracking-widest"
                placeholder="______"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full btn-primary mt-4"
            >
              {verifying ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="mt-3 text-center">
              <button
                onClick={handleResendCode}
                disabled={resending}
                className="text-sm text-brand-400 hover:underline"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            </div>

            <p className="text-center text-white/40 text-xs mt-4">
              The code expires in 15 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Otherwise, show the registration form ────────────────────
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center py-12"
      style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 w-full max-w-2xl p-4">
        <div className="card glass-strong p-8">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={17} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>KUA</span>
          </div>

          <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4, color: 'var(--text-primary)' }}>Begin your journey</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Create your free account</p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label" style={{ color: 'var(--text-secondary)' }}>Full name</label>
                <input 
                  className="input" 
                  value={form.fullName} 
                  onChange={set('fullName')} 
                  required 
                  style={{ 
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)'
                  }}
                />
              </div>
              <div>
                <label className="label" style={{ color: 'var(--text-secondary)' }}>Username</label>
                <input 
                  className="input" 
                  value={form.username} 
                  onChange={set('username')} 
                  required 
                  minLength={3}
                  style={{ 
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)'
                  }}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="label" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label>
              <input
                type="date"
                className="input"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="label" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="input" 
                  style={{ 
                    paddingLeft: 38,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)'
                  }} 
                  value={form.email} 
                  onChange={set('email')} 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="label" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ 
                    paddingLeft: 38, 
                    paddingRight: 38,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)'
                  }}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} color="var(--text-muted)" /> : <Eye size={16} color="var(--text-muted)" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" style={{ color: 'var(--text-secondary)' }}>Education level (Kenyan Curriculum)</label>
              <select 
                className="input" 
                style={{ 
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }} 
                value={form.educationLevel} 
                onChange={set('educationLevel')} 
                required
              >
                {educationLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" style={{ color: 'var(--text-secondary)' }}>Institution / School</label>
              <div style={{ position: 'relative' }}>
                <Building size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  style={{ 
                    paddingLeft: 38,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)'
                  }}
                  placeholder="e.g., Strathmore University"
                  value={form.institution}
                  onChange={set('institution')}
                  required
                />
              </div>
            </div>

            {showCourse && (
              <div>
                <label className="label" style={{ color: 'var(--text-secondary)' }}>Course / Program</label>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  {courseOptions.length > 0 ? (
                    <select 
                      className="input" 
                      style={{ 
                        paddingLeft: 38,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border)'
                      }} 
                      value={form.course} 
                      onChange={set('course')} 
                      required
                    >
                      <option value="">Select your course</option>
                      {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input"
                      style={{ 
                        paddingLeft: 38,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border)'
                      }}
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
              <label className="label" style={{ color: 'var(--text-secondary)' }}>Role</label>
              <div style={{ position: 'relative' }}>
                <Users size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  className="input"
                  style={{ 
                    paddingLeft: 38,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)'
                  }}
                  value={form.role}
                  onChange={handleRoleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>

            {form.role === 'teacher' && (
              <div>
                <label className="label" style={{ color: 'var(--text-secondary)' }}>Courses you teach *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input flex-1"
                    style={{ 
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)'
                    }}
                    placeholder="e.g., Mathematics"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCourse())}
                  />
                  <button type="button" onClick={handleAddCourse} className="btn-primary" style={{ padding: '0 12px' }}>
                    <Plus size={16} />
                  </button>
                </div>
                {form.teacherCourses.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.teacherCourses.map((course) => (
                      <span key={course} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: 'var(--text-primary)' }}>
                        {course}
                        <button type="button" onClick={() => handleRemoveCourse(course)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.role === 'parent' && (
              <div>
                <label className="label" style={{ color: 'var(--text-secondary)' }}>Schools your child(ren) attend *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input flex-1"
                    style={{ 
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)'
                    }}
                    placeholder="e.g., Sunshine Academy"
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSchool())}
                  />
                  <button type="button" onClick={handleAddSchool} className="btn-primary" style={{ padding: '0 12px' }}>
                    <Plus size={16} />
                  </button>
                </div>
                {form.parentSchools.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.parentSchools.map((school) => (
                      <span key={school} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: 'var(--text-primary)' }}>
                        {school}
                        <button type="button" onClick={() => handleRemoveSchool(school)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
              {loading ? (
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>or continue with</span>
            </div>
          </div>

          <GoogleSignInButton mode="register" />

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}