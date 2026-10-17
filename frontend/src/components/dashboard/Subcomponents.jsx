import { useNavigate } from 'react-router-dom';
import HolographicAvatar from '../HolographicAvatar';
import { Play, BookOpen, Target, Compass, Rocket, CheckCircle, Calendar, ArrowRight } from 'lucide-react';

const AVATAR_MAP = {
  happy: '/happy.jpg', excited: '/excited.jpg', thinking: '/thinking.jpg',
  neutral: '/neutral.jpg', suprised: '/suprised.jpg', celebrating: '/celebrating.jpg',
  focused: '/focused.jpg', calm: '/calm.jpg',
};

// ─── 1. Welcome Header ────────────────────────────────────────
export function WelcomeHeader({ user, returning, focusRemaining = 0, onStartFocus }) {
  const firstName = (user?.full_name || user?.username || 'Learner').split(' ')[0];

  return (
    <header className={`welcome-header ${returning ? 'compact' : ''}`}>
      <div className="welcome-left">
        <div className="welcome-avatar">
          <HolographicAvatar
            size={returning ? 44 : 56}
            animation="float"
            imageMap={AVATAR_MAP}
            imageSrc={user?.avatar_url || null}
          />
        </div>
        <div className="welcome-text">
          {returning ? (
            <>
              <h1>Welcome back, {firstName}</h1>
              <p className="welcome-sub">Pick up where you left off.</p>
            </>
          ) : (
            <>
              <h1>Hi {firstName}.</h1>
              <p className="welcome-sub">What would you like to learn today?</p>
            </>
          )}
        </div>
      </div>
      {returning && focusRemaining > 0 && (
        <button type="button" className="focus-pill" onClick={onStartFocus}>
          <Play size={14} /> Focus <span className="focus-pill-count">{focusRemaining}</span>
        </button>
      )}
    </header>
  );
}

// ─── 2. Philosophy Strip ──────────────────────────────────────
export function PhilosophyStrip() {
  return (
    <section className="philosophy-strip">
      <p className="philosophy-caption">How KUA connects your journey</p>
      <div className="philosophy-nodes">
        {[
          { icon: BookOpen, label: 'Learning', sub: 'Academic understanding' },
          { icon: Target, label: 'Capability', sub: 'Applied through practice' },
          { icon: Compass, label: 'Opportunity', sub: 'Where it can lead' },
        ].map((n, i, arr) => (
          <div className="philosophy-node" key={n.label}>
            <div className="philosophy-icon"><n.icon size={18} /></div>
            <div className="philosophy-text">
              <span className="philosophy-label">{n.label}</span>
              <span className="philosophy-sub">{n.sub}</span>
            </div>
            {i < arr.length - 1 && <span className="philosophy-arrow">→</span>}
          </div>
        ))}
      </div>
      <p className="philosophy-note">Learning does not automatically prove capability, and capability does not guarantee opportunity. KUA helps you connect these over time.</p>
    </section>
  );
}

// ─── 3. First-Time Dashboard ──────────────────────────────────
export function FirstTimeDashboard() {
  const navigate = useNavigate();
  return (
    <section className="first-time">
      <div className="first-time-hero">
        <div className="first-time-hero-icon"><BookOpen size={28} /></div>
        <h2 className="first-time-title">Start learning</h2>
        <p className="first-time-lead">Choose a subject in the Academic Hub and KUA will adapt as you go.</p>
        <button type="button" className="btn-primary first-time-cta" onClick={() => navigate('/studysphere')}>
          Open Academic Hub <ArrowRight size={16} />
        </button>
      </div>
      <div className="first-time-secondary">
        <button type="button" className="secondary-card" onClick={() => navigate('/orbit')}>
          <div className="secondary-icon"><Rocket size={20} /></div>
          <div className="secondary-text">
            <span className="secondary-title">Explore a practical challenge</span>
            <span className="secondary-sub">Practice real problems in Orbit</span>
          </div>
          <ArrowRight size={16} className="secondary-chev" />
        </button>
      </div>
    </section>
  );
}

// ─── 4. Returning Dashboard ───────────────────────────────────
export function ReturningDashboard({ tasks, timetable, assignments, orbitCount, stackedSuggestions, lessonProgress, onCompleteTask }) {
  const navigate = useNavigate();
  
  // Logic to find what to show
  const lesson = pickUnfinishedLesson(lessonProgress);
  const openTask = Array.isArray(tasks) ? tasks.find(t => !t.is_completed) : null;
  const upcoming = pickUpcoming(timetable, assignments);
  const challenge = Array.isArray(stackedSuggestions) && stackedSuggestions.length > 0 ? stackedSuggestions[0] : null;
  const orbits = typeof orbitCount === 'number' ? orbitCount : (orbitCount?.count ?? 0);
  const next = pickNextAction({ lesson, openTask, upcoming, orbits });

  const hasAny = lesson || openTask || upcoming || challenge;
  if (!hasAny) {
    return (
      <section className="returning empty">
        <button className="btn-primary" onClick={() => navigate('/studysphere')}>Open Academic Hub <ArrowRight size={16} /></button>
      </section>
    );
  }

  return (
    <section className="returning">
      <div className="returning-grid">
        {lesson && (
          <article className="rd-card">
            <header className="rd-head"><BookOpen size={16} /> <span>Continue learning</span></header>
            <h3 className="rd-title">{lesson.title}</h3>
            <p className="rd-sub">{lesson.subject}</p>
            <div className="rd-progress">
              <div className="rd-progress-bar"><div className="rd-progress-fill" style={{ width: `${lesson.progress}%` }} /></div>
              <span className="rd-progress-label">{lesson.progress}%</span>
            </div>
            <button className="rd-action" onClick={() => navigate(lesson.href)}>Resume lesson <ArrowRight size={14} /></button>
          </article>
        )}

        {openTask && (
          <article className="rd-card">
            <header className="rd-head"><CheckCircle size={16} /> <span>Today's task</span></header>
            <h3 className="rd-title">{openTask.title}</h3>
            {openTask.due_date && <p className="rd-sub">Due {new Date(openTask.due_date).toLocaleDateString()}</p>}
            <label className="rd-checkbox">
              <input type="checkbox" onChange={() => onCompleteTask(openTask)} />
              <span>Mark as done</span>
            </label>
          </article>
        )}

        {upcoming && (
          <article className="rd-card">
            <header className="rd-head"><Calendar size={16} /> <span>Coming up</span></header>
            <h3 className="rd-title">{upcoming.title}</h3>
            <p className="rd-sub">{upcoming.when}</p>
            <button className="rd-action" onClick={() => navigate(upcoming.href)}>Open <ArrowRight size={14} /></button>
          </article>
        )}

        {challenge && (
          <article className="rd-card">
            <header className="rd-head"><Rocket size={16} /> <span>Suggested for you</span></header>
            <h3 className="rd-title">{challenge.title || 'Practical challenge'}</h3>
            <p className="rd-sub">{challenge.reason || challenge.text || 'Practise a real problem in Orbit.'}</p>
            <button className="rd-action" onClick={() => navigate('/orbit')}>Open Orbit <ArrowRight size={14} /></button>
          </article>
        )}

        {next && (
          <article className="rd-card">
            <header className="rd-head"><Target size={16} /> <span>Next useful action</span></header>
            <h3 className="rd-title">{next.title}</h3>
            <p className="rd-sub">{next.reason}</p>
            <button className="rd-action" onClick={() => navigate(next.href)}>{next.cta} <ArrowRight size={14} /></button>
          </article>
        )}
      </div>
    </section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
function pickUnfinishedLesson(lp) {
  if (!lp) return null;
  const raw = lp.current ?? lp.unfinished ?? lp.in_progress;
  if (!raw) return null;
  const progress = Number(raw.progress_percent ?? raw.progress ?? 0);
  if (progress <= 0 || progress >= 100) return null;
  return {
    title: raw.lesson_title || raw.title || 'Unfinished lesson',
    subject: raw.subject || raw.course || 'Academic',
    progress: Math.round(progress),
    href: raw.href || `/studysphere?lesson=${raw.id ?? ''}`,
  };
}

function pickUpcoming(timetable, assignments) {
  const now = Date.now();
  const cands = [];
  (Array.isArray(assignments) ? assignments : []).forEach(a => {
    const when = a.due_date || a.due_at || a.deadline;
    if (!when) return;
    const t = new Date(when).getTime();
    if (Number.isNaN(t) || t < now) return;
    cands.push({ title: a.title || 'Assignment', when: `Due ${new Date(when).toLocaleString()}`, time: t, href: `/studysphere?assignment=${a.id}` });
  });
  (Array.isArray(timetable) ? timetable : []).forEach(e => {
    const when = e.starts_at || e.start_time;
    if (!when) return;
    const t = new Date(when).getTime();
    if (Number.isNaN(t) || t < now) return;
    cands.push({ title: e.subject_name || e.title || 'Class', when: `Starts ${new Date(when).toLocaleString()}`, time: t, href: `/studysphere?timetable=${e.id}` });
  });
  cands.sort((a, b) => a.time - b.time);
  return cands[0] ?? null;
}

function pickNextAction({ lesson, openTask, upcoming, orbits }) {
  if (lesson || openTask || upcoming) return null;
  if (orbits > 0) return { title: 'Practise in Orbit', reason: 'Keep your learning active with a short session.', cta: 'Open Orbit', href: '/orbit' };
  return { title: 'Start a lesson', reason: 'Pick a subject in the Academic Hub to begin.', cta: 'Open Academic Hub', href: '/studysphere' };
}