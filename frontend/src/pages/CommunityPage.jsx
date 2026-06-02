import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Heart, Send, Users, Zap } from "lucide-react"
import { api } from "../services/api"
import { useAuth } from "../hooks/useAuth"

export default function CommunityPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postText, setPostText] = useState("")
  const [posting, setPosting] = useState(false)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [cd, pd] = await Promise.all([api.getCommunities(), api.getPosts(id)])
        const comm = cd.communities.find(c => c.id === id)
        setCommunity(comm)
        setIsMember(comm?.is_member || false)
        setPosts(pd.posts)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handlePost = async () => {
    if (!postText.trim()) return
    setPosting(true)
    try {
      const d = await api.createPost(id, { content: postText.trim() })
      setPosts(p => [d.post, ...p])
      setPostText("")
    } catch(e) { alert(e.message) }
    finally { setPosting(false) }
  }

  const handleLike = async (postId) => {
    const d = await api.likePost(postId)
    setPosts(p => p.map(post => post.id === postId
      ? { ...post, is_liked: d.liked, likes_count: d.liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1) }
      : post))
  }

  const timeAgo = date => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000)
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }

  if (loading) return (
    <div style={{padding:32}}>
      <div style={{height:120,borderRadius:16,background:"rgba(255,255,255,0.04)",animation:"shimmer 2s linear infinite"}}/>
    </div>
  )

  return (
    <div style={{padding:32,maxWidth:700,margin:"0 auto"}}>
      <button onClick={() => navigate("/communities")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:13,display:"flex",alignItems:"center",gap:6,marginBottom:20,padding:0}}>
        <ArrowLeft size={15}/>Back to communities
      </button>

      {community && (
        <div className="card glass-strong" style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 4px"}}>{community.name}</h1>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"rgba(255,255,255,0.4)"}}>
                <Users size={11}/>{(community.member_count||0).toLocaleString()} members
                {community.subject && <> · {community.subject}</>}
              </div>
            </div>
            <button onClick={async () => { isMember ? await api.leaveCommunity(id) : await api.joinCommunity(id); setIsMember(p => !p) }}
              style={{padding:"7px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:isMember?"rgba(255,255,255,0.05)":"#3b82f6",color:isMember?"rgba(255,255,255,0.5)":"white"}}>
              {isMember ? "Leave" : "Join community"}
            </button>
          </div>
          {community.description && <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:12,lineHeight:1.6}}>{community.description}</p>}
        </div>
      )}

      {isMember ? (
        <div className="card" style={{marginBottom:16}}>
          <textarea className="input" style={{resize:"none",height:88,marginBottom:10}}
            placeholder="Share something with the community…"
            value={postText} onChange={e => setPostText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handlePost() }}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>Ctrl+Enter to post</span>
            <button onClick={handlePost} disabled={!postText.trim()||posting} className="btn-primary" style={{padding:"7px 16px",fontSize:13}}>
              {posting ? <span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/> : <><Send size={13}/>Post</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{textAlign:"center",padding:20,fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:16}}>
          Join this community to post
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {posts.length === 0 ? (
          <div className="card" style={{textAlign:"center",padding:40,color:"rgba(255,255,255,0.3)",fontSize:13}}>
            No posts yet. Be the first to share!
          </div>
        ) : posts.map(post => (
          <div key={post.id} className="card">
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#3b82f6,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0}}>
                {(post.full_name||post.username||"U").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontWeight:600,fontSize:13}}>{post.full_name||post.username}</span>
                  <span style={{fontSize:10,color:"#60a5fa",background:"rgba(59,130,246,0.1)",padding:"1px 6px",borderRadius:6,display:"flex",alignItems:"center",gap:3}}>
                    <Zap size={8}/>Lv{post.level}
                  </span>
                </div>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{timeAgo(post.created_at)}</span>
              </div>
            </div>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",lineHeight:1.6,margin:"0 0 10px",whiteSpace:"pre-wrap"}}>{post.content}</p>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10}}>
              <button onClick={() => handleLike(post.id)}
                style={{background:post.is_liked?"rgba(248,113,113,0.1)":"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:12,color:post.is_liked?"#f87171":"rgba(255,255,255,0.3)",padding:"4px 10px",borderRadius:8}}>
                <Heart size={13} style={{fill:post.is_liked?"currentColor":"none"}}/>{post.likes_count||0}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}