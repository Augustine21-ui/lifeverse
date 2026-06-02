
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Flame, Target, Award, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getDashboard().then(setData).catch(console.error).finally(()=>setLoading(false)); }, []);

  const xpPercent = data?.user?.xpPercent ?? 0;
  const level = data?.user?.level ?? user?.level ?? 1;
  const streakDays = data?.user?.streakDays ?? user?.streaSkDays ?? 0;
  const totalXP = data?.user?.xp ?? user?.xp ?? 0;

  const chartData = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const iso = d.toISOString().split('T')[0];
    const found = data?.xpHistory?.find(h=>h.date?.startsWith(iso));
    return { day: d.toLocaleDateString('en',{weekday:'short'}), xp: found ? parseInt(found.xp) : 0 };
  });

  if (loading) return <div style={{padding:32}}>{[1,2,3].map(i=><div key={i} style={{height:100,borderRadius:16,marginBottom:16,background:'rgba(255,255,255,0.04)',animation:'shimmer 2s linear infinite'}}/>)}</div>;

  const activeGoals = data?.goalsByCategory?.reduce((a,c)=>a+parseInt(c.active||0),0)??0;
  const badgesCount = data?.recentBadges?.length??0;
  const commCount = user?.stats?.communitiesCount??0;

  return (
    <div style={{padding:32,maxWidth:1000,margin:'0 auto'}} className="animate-fade-up">
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:32,fontWeight:800,margin:0}}>Hey, {user?.fullName?.split(' ')[0]||user?.username} 👋</h1>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:14,marginTop:4}}>Here is your learning overview</p>
      </div>

      <div className="card" style={{marginBottom:24,background:'rgba(59,130,246,0.05)',border:'1px solid rgba(59,130,246,0.15)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 0% 50%,rgba(59,130,246,0.08),transparent 60%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',position:'relative'}}>
          <div style={{width:64,height:64,borderRadius:18,background:'linear-gradient(135deg,#3b82f6,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,flexShrink:0}}>{level}</div>
          <div style={{flex:1,minWidth:200}}>
            <p style={{margin:'0 0 2px',fontSize:13,color:'rgba(255,255,255,0.4)'}}>Current level</p>
            <p style={{margin:'0 0 2px',fontSize:20,fontWeight:700}}>Level {level}</p>
            <p style={{margin:'0 0 10px',fontSize:12,color:'rgba(255,255,255,0.3)'}}>{totalXP.toLocaleString()} total XP</p>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:6}}>
              <span style={{display:'flex',alignItems:'center',gap:4}}><Zap size={10} color="#60a5fa"/>{data?.user?.xpProgress??0} / 500 XP to next level</span>
              <span>{xpPercent}%</span>
            </div>
            <div className="xp-bar-track" style={{height:10}}><div className="xp-bar-fill" style={{width:`${xpPercent}%`,height:'100%'}}/></div>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16,marginBottom:24}}>
        {[
          {icon:Flame,label:'Day streak',value:streakDays,color:'#fb923c'},
          {icon:Target,label:'Active goals',value:activeGoals,color:'#60a5fa'},
          {icon:Award,label:'Badges earned',value:badgesCount,color:'#a78bfa'},
          {icon:Users,label:'Communities',value:commCount,color:'#2dd4bf'},
        ].map(({icon:Icon,label,value,color})=>(
          <div key={label} className="card">
            <div style={{width:36,height:36,borderRadius:10,background:`${color}20`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
              <Icon size={17} color={color}/>
            </div>
            <div style={{fontSize:28,fontWeight:800,lineHeight:1}}>{value}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:24}}>
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{margin:0,fontWeight:700}}>XP this week</h3>
            <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#60a5fa'}}>
              <TrendingUp size={13}/>{chartData.reduce((a,c)=>a+c.xp,0)} XP
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{fill:'rgba(255,255,255,0.3)',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,color:'white',fontSize:12}}/>
              <Area type="monotone" dataKey="xp" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h3 style={{margin:0,fontWeight:700,fontSize:15}}>Badges</h3>
            <Link to="/badges" style={{fontSize:12,color:'#60a5fa',textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>All <ArrowRight size={12}/></Link>
          </div>
          {data?.recentBadges?.length>0 ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {data.recentBadges.slice(0,6).map(b=>(
                <div key={b.id} title={b.name} style={{aspectRatio:'1',borderRadius:10,background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏆</div>
              ))}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'20px 0',color:'rgba(255,255,255,0.25)',fontSize:13}}>Complete goals to earn badges</div>
          )}
        </div>
      </div>

      {data?.goalsByCategory?.length>0 && (
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h3 style={{margin:0,fontWeight:700}}>Goals by category</h3>
            <Link to="/goals" style={{fontSize:12,color:'#60a5fa',textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>View all <ArrowRight size={12}/></Link>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {data.goalsByCategory.map(cat=>{
              const active=parseInt(cat.active||0),completed=parseInt(cat.completed||0),total=active+completed;
              const pct=total>0?Math.round((completed/total)*100):0;
              return (
                <div key={cat.category} style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{width:80,fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'capitalize'}}>{cat.category}</span>
                  <div style={{flex:1,height:8,background:'rgba(255,255,255,0.08)',borderRadius:999,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#3b82f6,#7c3aed)',borderRadius:999,transition:'width 0.5s'}}/>
                  </div>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.4)',width:60,textAlign:'right'}}>{completed}/{total} done</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}