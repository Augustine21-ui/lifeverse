// src/components/GlanceTicker.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Clock, Users } from 'lucide-react';

// Custom time formatter (replaces date-fns)
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

const GlanceTicker = ({ posts = [], loading = false, autoScrollInterval = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll effect
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    if (isPaused) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, autoScrollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [posts, isPaused, autoScrollInterval]);

  // Reset index when posts change
  useEffect(() => {
    setCurrentIndex(0);
  }, [posts]);

  // Handle navigation to Momentum
  const handleClick = () => {
    navigate('/momentum');
  };

  // Handle manual dot click
  const handleDotClick = (index) => {
    setCurrentIndex(index);
    // Reset auto-scroll timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
      }, autoScrollInterval);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded w-1/3"></div>
            <div className="h-3 bg-white/5 rounded w-2/3"></div>
            <div className="h-3 bg-white/5 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-6 text-center">
        <MessageCircle className="w-10 h-10 mx-auto mb-3 text-white/20" />
        <p className="text-white/40 text-sm">No posts in the feed yet</p>
        <Link to="/momentum" className="text-brand-400 text-sm hover:underline mt-2 inline-block">
          Be the first to post →
        </Link>
      </div>
    );
  }

  const currentPost = posts[currentIndex];

  return (
    <div 
      className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 cursor-pointer transition-all hover:from-purple-900/30 hover:to-blue-900/30 border border-white/5"
      onClick={handleClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {currentPost.full_name?.[0] || currentPost.user?.name?.[0] || 'U'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-white/90 truncate">
              {currentPost.full_name || currentPost.user?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-white/40 flex-shrink-0">
              • {formatTimeAgo(currentPost.created_at)}
            </span>
            {currentPost.community && (
              <span className="text-xs text-white/30 flex-shrink-0 flex items-center gap-1">
                <Users size={12} />
                <span className="truncate max-w-[80px]">{currentPost.community.name}</span>
              </span>
            )}
          </div>
          
          <p className="text-white/80 text-sm line-clamp-2 mb-2">
            {currentPost.content}
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Heart className="w-4 h-4" />
              <span>{currentPost.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <MessageCircle className="w-4 h-4" />
              <span>{currentPost.comments_count || 0}</span>
            </div>
            <div className="text-xs text-brand-400 ml-auto">
              Click to view
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      {posts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {posts.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'w-6 bg-brand-500' 
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to post ${idx + 1}`}
            />
          ))}
          {posts.length > 5 && (
            <span className="text-[10px] text-white/30 ml-1">
              +{posts.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GlanceTicker;