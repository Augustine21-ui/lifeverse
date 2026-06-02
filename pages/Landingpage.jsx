import { Link } from 'react-router-dom';
import { Zap, Target, Users, Award, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: Target, title: 'Smart Goal Tracking', desc: 'Break down big learning goals into milestones and track your progress with visual clarity.' },
  { icon: Award, title: 'Earn Badges & XP', desc: 'Get rewarded for your achievements. Level up and unlock badges as you hit new milestones.' },
  { icon: Users, title: 'Learning Communities', desc: 'Join subject-specific communities, share knowledge, and grow with peers worldwide.' },
  { icon: Star, title: 'Streak System', desc: 'Build consistent learning habits with daily streaks and stay motivated every day.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen font-body">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl">Lifeverse</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-white/60 mb-8 border border-brand-500/20">
          <Zap size={14} className="text-brand-400" />
          <span>Gamified learning for every student</span>
        </div>

        <h1 className="font-display text-6xl sm:text-7xl font-bold leading-[1.05] mb-6 tracking-tight">
          Level Up Your
          <br />
          <span className="text-gradient">Learning Journey</span>
        </h1>

        <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          Lifeverse turns studying into an adventure. Set goals, earn badges, join communities,
          and track your progress — all in one beautiful platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary px-8 py-3.5 text-base">
            Start for free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary px-8 py-3.5 text-base">
            Sign in
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-center">
          {[['10K+', 'Students'], ['50+', 'Badges to earn'], ['6', 'Communities'], ['Daily', 'Streaks']].map(([val, label]) => (
            <div key={label}>
              <div className="font-display font-bold text-2xl text-gradient">{val}</div>
              <div className="text-sm text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:bg-white/[0.06] transition-colors duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/25 transition-colors">
                <Icon size={18} className="text-brand-400" />
              </div>
              <h3 className="font-display font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}