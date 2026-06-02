
import { Link } from 'react-router-dom';
import { Zap, Target, Users, Award, ArrowRight, Flame } from 'lucide-react';

const features = [
  { icon: Target, title: 'Smart Goal Tracking', desc: 'Break big learning goals into milestones and track progress visually.' },
  { icon: Award, title: 'Earn Badges and XP', desc: 'Get rewarded for achievements. Level up and unlock badges as you grow.' },
  { icon: Users, title: 'Learning Communities', desc: 'Join subject communities, share knowledge, and grow with peers.' },
  { icon: Flame, title: 'Daily Streaks', desc: 'Build consistent habits with streak tracking and daily motivation.' },
];

export default function LandingPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 32px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Zap size={17} color="white"/>
          </div>
          <span style={{fontWeight:700,fontSize:20}}>Lifeverse</span>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <Link to="/login" style={{color:'rgba(255,255,255,0.6)',textDecoration:'none',fontWeight:500,fontSize:14,padding:'8px 16px',borderRadius:10}}>Sign in</Link>
          <Link to="/register" style={{background:'#3b82f6',color:'white',textDecoration:'none',fontWeight:600,fontSize:14,padding:'9px 20px',borderRadius:10,display:'flex',alignItems:'center',gap:6}}>Get started <ArrowRight size={15}/></Link>
        </div>
      </nav>

      <section style={{textAlign:'center',padding:'80px 24px 60px',maxWidth:700,margin:'0 auto'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:999,padding:'6px 16px',fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:32}}>
          <Zap size={13} color="#60a5fa"/> Gamified learning for every student
        </div>
        <h1 style={{fontSize:'clamp(2.5rem,6vw,4.5rem)',fontWeight:800,lineHeight:1.05,marginBottom:24,letterSpacing:'-1px'}}>
          Level Up Your<br/><span className="text-gradient">Learning Journey</span>
        </h1>
        <p style={{fontSize:17,color:'rgba(255,255,255,0.5)',lineHeight:1.7,marginBottom:40}}>
          Lifeverse turns studying into an adventure. Set goals, earn badges, join communities, and track your progress.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/register" style={{background:'linear-gradient(135deg,#3b82f6,#6d28d9)',color:'white',textDecoration:'none',fontWeight:700,fontSize:15,padding:'13px 32px',borderRadius:12,display:'flex',alignItems:'center',gap:8}}>Start for free <ArrowRight size={17}/></Link>
          <Link to="/login" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'white',textDecoration:'none',fontWeight:600,fontSize:15,padding:'13px 32px',borderRadius:12}}>Sign in</Link>
        </div>
      </section>

      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 80px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16}}>
          {features.map(({icon:Icon,title,desc}) => (
            <div key={title} className="card" style={{transition:'background 0.2s'}}>
              <div style={{width:42,height:42,borderRadius:12,background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                <Icon size={19} color="#60a5fa"/>
              </div>
              <h3 style={{fontWeight:700,fontSize:15,marginBottom:8}}>{title}</h3>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',lineHeight:1.6,margin:0}}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}