// frontend/src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, AlertCircle, Building, GraduationCap, Users, Eye, EyeOff, Plus, X } from 'lucide-react';
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
    // Extra fields for teacher/parent
    teacherCourses: [],   // array of course names
    parentSchools: [],    // array of school names
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // For adding course (teacher)
  const [newCourse, setNewCourse] = useState('');
  // For adding school (parent)
  const [newSchool, setNewSchool] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // When role changes, reset the extra arrays to avoid confusion
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!form.username || !form.email || !form.password || !form.fullName || !form.institution) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Role-specific validation
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

    try {
      const data = await register(form);
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
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center py-12"
      style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl p-4">
        <div className="card glass-strong">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={17} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 22 }}>Lifeverse</span>
          </div>

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
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
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
                  {showPassword ? <EyeOff size={16} color="rgba(255,255,255,0.5)" /> : <Eye size={16} color="rgba(255,255,255,0.5)" />}
                </button>
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
                <select
                  className="input"
                  style={{ paddingLeft: 38 }}
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

            {/* Teacher: Add courses */}
            {form.role === 'teacher' && (
              <div>
                <label className="label">Courses you teach *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input flex-1"
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
                      <span key={course} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                        {course}
                        <button type="button" onClick={() => handleRemoveCourse(course)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Parent: Add schools */}
            {form.role === 'parent' && (
              <div>
                <label className="label">Schools your child(ren) attend *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input flex-1"
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
                      <span key={school} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                        {school}
                        <button type="button" onClick={() => handleRemoveSchool(school)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
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

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
            Already have an account? <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}