
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Target, Users, Award, Trophy, LogOut, Zap, Menu } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/communities', icon: Users, label: 'Communities' },
  { to: '/badges', icon: Award, label: 'Badges' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/'); };
  const xpPercent = user?.stats?.xpPercent ?? Math.round(((user?.xp ?? 0) % 500) / 500 * 100);

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:30}} />}
      <aside style={{width:256,flexShrink:0,display:'flex',flexDirection:'column',borderRight:'1px solid rgba(255,255,255,0.06)',background:'rgba(10,10,15,0.98)',position:'sticky',top:0,height:'100vh',zIndex:40}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Zap size={16} color="white" />
          </div>
          <span style={{fontWeight:700,fontSize:20,letterSpacing:'-0.5px'}}>Lifeverse</span>
        </div>
        <div style={{margin:'16px',padding:'16px',borderRadius:16,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#3b82f6,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14}}>
              {(user?.fullName||user?.username||'U')[0].toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:600,fontSize:14,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.fullName||user?.username}</p>
              <p style={{fontSize:12,color:'rgba(255,255,255,0.4)',margin:0}}>Level {user?.level||1}</p>
            </div>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span>{user?.xp??0} XP</span><span>{xpPercent}%</span>
          </div>
          <div className="xp-bar-track"><div className="xp-bar-fill" style={{width:`${xpPercent}%`}} /></div>
        </div>
        <nav style={{flex:1,padding:'8px 16px',display:'flex',flexDirection:'column',gap:4}}>
          {navItems.map(({to,icon:Icon,label}) => (
            <NavLink key={to} to={to} className={({isActive}) => `nav-item ${isActive?'nav-item-active':'nav-item-inactive'}`}>
              <Icon size={18}/><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{padding:'0 16px 24px'}}>
          <button onClick={handleLogout} className="nav-item nav-item-inactive" style={{width:'100%'}}>
            <LogOut size={18}/><span>Sign out</span>
          </button>
        </div>
      </aside>
      <main style={{flex:1,overflowAuto:'auto',minWidth:0}}><Outlet /></main>
    </div>
  );
}