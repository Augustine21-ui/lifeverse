import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function GoogleSignInButton({ mode = 'login' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleGoogleSuccess = async (codeResponse) => {
    try {
      console.log('🔍 Google auth code response:', codeResponse);

      // Send the authorization code to your backend
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeResponse.code,   // <- send the code, not access_token
          mode: mode,
        }),
      });

      // Read the response as text first (for debugging)
      const text = await res.text();
      console.log('📦 Backend response:', text);

      if (!res.ok) {
        throw new Error(text || 'Google authentication failed');
      }

      // Parse JSON
      const data = JSON.parse(text);

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      showToast(`Successfully ${mode === 'login' ? 'logged in' : 'registered'} with Google!`, 'success');

      // Redirect based on role
      const role = data.user?.role || 'student';
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('❌ Google auth error:', err);
      showToast(err.message || 'Google authentication failed', 'error');
    }
  };

  // Use the 'auth-code' flow (not 'implicit')
  const loginGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      showToast('Google login failed. Please try again.', 'error');
    },
    flow: 'auth-code', // <-- CHANGE HERE
    // redirect_uri: 'postmessage', // optional – defaults to postmessage
  });

  return (
    <button
      type="button"
      onClick={loginGoogle}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border transition-all duration-200"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = 'var(--accent)';
        e.target.style.background = 'var(--bg-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = 'var(--border)';
        e.target.style.background = 'var(--bg-card)';
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
    </button>
  );
}