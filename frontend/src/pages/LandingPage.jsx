import { Link, useNavigate } from 'react-router-dom';
import { Zap, Target, Users, Award, ArrowRight, Flame } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const features = [
  { icon: Target, title: 'Smart Goal Tracking', desc: 'Break big learning goals into milestones and track progress visually.' },
  { icon: Award, title: 'Earn Badges and XP', desc: 'Get rewarded for achievements. Level up and unlock badges as you grow.' },
  { icon: Users, title: 'Learning Communities', desc: 'Join subject communities, share knowledge, and grow with peers.' },
  { icon: Flame, title: 'Daily Streaks', desc: 'Build consistent habits with streak tracking and daily motivation.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      background: 'linear-gradient(145deg, #0b0b1a 0%, #14142e 50%, #1a1a3e 100%)',
      color: '#f0f0f0',
    }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        maxWidth: 1100,
        margin: '0 auto',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg,#3b82f6,#7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={17} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, color: 'white' }}>Lifeverse</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'linear-gradient(135deg,#3b82f6,#6d28d9)',
                color: 'white',
                border: 'none',
                padding: '9px 20px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                opacity: 0.9,
              }}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                  padding: '8px 16px',
                  borderRadius: 10,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{
                  background: 'linear-gradient(135deg,#4a6fa5,#3b5a8a)',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '9px 20px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                  transition: 'transform 0.15s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 6px 20px rgba(59,130,246,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                }}
              >
                Get started <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '80px 24px 60px',
        maxWidth: 700,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 999,
          padding: '6px 16px',
          fontSize: 13,
          color: '#a0c4ff',
          marginBottom: 32,
        }}>
          <Zap size={13} color="#60a5fa" /> Gamified learning for every student
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem,6vw,4.5rem)',
          fontWeight: 800,
          lineHeight: 1.05,
          marginBottom: 24,
          letterSpacing: '-1px',
          color: 'white',
        }}>
          Level Up Your<br />
          <span style={{
            background: 'linear-gradient(135deg, #93c5fd, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Learning Journey</span>
        </h1>
        <p style={{
          fontSize: 17,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          Lifeverse turns studying into an adventure. Set goals, earn badges, join communities, and track your progress.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!user && (
            <>
              <Link
                to="/register"
                style={{
                  background: 'linear-gradient(135deg,#4a6fa5,#3b5a8a)',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  padding: '13px 32px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                  transition: 'transform 0.15s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 8px 28px rgba(59,130,246,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 16px rgba(59,130,246,0.35)';
                }}
              >
                Start for free <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '13px 32px',
                  borderRadius: 12,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.06)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 24px 80px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
        }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '24px 20px',
                transition: 'background 0.25s, border-color 0.25s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon size={19} color="#60a5fa" />
              </div>
              <h3 style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 8,
                color: 'white',
              }}>{title}</h3>
              <p style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.6,
                margin: 0,
              }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Optional footer note (remove if not needed) */}
      <div style={{
        textAlign: 'center',
        padding: '24px',
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        © 2026 Lifeverse – Built with ❤️
      </div>
    </div>
  );
}