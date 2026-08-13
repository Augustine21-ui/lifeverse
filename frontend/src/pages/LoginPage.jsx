import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else if (data.user?.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (data.user?.role === 'parent') {
        navigate('/parent-dashboard');
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
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      <div className="relative z-10 w-full max-w-md p-4">
        <div className="card glass-strong p-8">
          <div className="flex items-center gap-2 justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Zap size={20} color="white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Lifeverse</span>
          </div>

          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)' }} className="mb-6">Continue your learning journey</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm" style={{ color: 'var(--accent)' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium transition"
              style={{ background: 'linear-gradient(135deg, var(--accent), #6d28d9)', color: 'white' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
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

          <GoogleSignInButton mode="login" />

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            New to Lifeverse?{' '}
            <Link to="/register" style={{ color: 'var(--accent)' }} className="font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}