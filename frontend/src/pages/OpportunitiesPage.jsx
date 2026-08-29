// frontend/src/pages/OpportunitiesPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  Briefcase, Award, Users, BookOpen, Lightbulb, Sparkles,
  Search, Filter, MapPin, Clock, CheckCircle, Circle, X,
  ArrowRight, ChevronDown, ChevronUp, Star, User, GraduationCap,
  Globe, Calendar, Building, Link as LinkIcon, ExternalLink,
  TrendingUp, Zap, Shield, Heart, Target, Layers, Bookmark,
  Loader2, AlertCircle, Check, PenTool, Eye, ThumbsUp
} from 'lucide-react';

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('for-you');
  const [opportunities, setOpportunities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [applying, setApplying] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    remote: false,
    education_level: '',
    skills: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPartner, setShowPartner] = useState(false);

  // Demo organizations – clearly labelled
  const demoOrgs = [
    { id: 1, name: 'NexaTech', description: 'Demo Organization', logo: '🚀', verified: true, is_demo: true },
    { id: 2, name: 'Future Foundation', description: 'Demo Organization', logo: '🔮', verified: true, is_demo: true },
    { id: 3, name: 'Innovation Hub', description: 'Demo Organization', logo: '💡', verified: true, is_demo: true },
    { id: 4, name: 'KEPSA', description: 'KEPSA Demo Challenge — Concept', logo: '🏢', verified: true, is_demo: true },
  ];

  const educationLevels = ['high_school', 'undergraduate', 'graduate', 'postgraduate'];
  const opportunityTypes = ['job', 'internship', 'scholarship', 'challenge', 'mentorship', 'bootcamp', 'fellowship', 'certification', 'training', 'exchange'];

  // ─── For presentation: set to true to always use mock data ────────
  const USE_MOCK_ONLY = false; // set to true to skip API calls entirely

  useEffect(() => {
    loadData();
  }, []);

  // ─── UPDATED loadData with smart fallback ────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      // If we want to skip API and just use mock
      if (USE_MOCK_ONLY) {
        loadMockData();
        setLoading(false);
        return;
      }

      // Attempt to fetch from API
      const [personalized, all, apps] = await Promise.all([
        api.getOpportunitiesPersonalized(),
        api.getOpportunities(),
        api.getMyApplications()
      ]);

      // If API returned data, use it; otherwise fallback to mock
      const hasData = (personalized && personalized.length > 0) || (all && all.length > 0);
      if (hasData) {
        setOpportunities(all || []);
        setFiltered(personalized || []);
        setMyApplications(apps || []);
      } else {
        console.warn('API returned empty; loading mock data for presentation');
        loadMockData();
      }
    } catch (err) {
      console.error('Error loading opportunities:', err);
      loadMockData(); // fallback on error
    } finally {
      setLoading(false);
    }
  };

  // ─── UPDATED Mock data with more opportunities ────────────────────
  const loadMockData = () => {
    const mockOpps = [
      // ─── Jobs & Internships ──────────────────────────────────────
      {
        id: 1,
        title: 'Junior Web Developer Internship',
        organization_name: 'NexaTech',
        organization_logo: '🚀',
        is_verified: true,
        is_demo: true,
        type: 'internship',
        description: 'Build and maintain web applications for our growing platform.',
        skills_required: ['JavaScript', 'HTML/CSS', 'Web Development'],
        interests: ['Technology', 'Programming'],
        education_level: 'undergraduate',
        age_min: 18,
        age_max: 30,
        location: 'Nairobi / Remote',
        is_remote: true,
        deadline: '2026-09-30',
        match_score: 87,
        match_details: {
          skills: { score: 0.9, matched: ['JavaScript', 'HTML/CSS'], total: 3 },
          interests: { score: 1, matched: ['Technology'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 0.8 }
        },
        what_you_gain: ['Practical experience', 'Mentorship', 'Industry exposure', 'Certificate'],
        requirements: ['JavaScript', 'HTML/CSS', 'Basic Git'],
        eligibility: ['University', 'Kenya', '18+'],
        created_at: '2026-08-15'
      },
      {
        id: 2,
        title: 'Data Analyst Graduate Trainee',
        organization_name: 'NexaTech',
        organization_logo: '🚀',
        is_verified: true,
        is_demo: true,
        type: 'job',
        description: 'Support our data team in building dashboards and analysing user behaviour.',
        skills_required: ['Python', 'SQL', 'Data Visualization'],
        interests: ['Data', 'Analytics'],
        education_level: 'undergraduate',
        location: 'Nairobi',
        is_remote: false,
        deadline: '2026-10-10',
        match_score: 76,
        match_details: {
          skills: { score: 0.7, matched: ['Python', 'SQL'], total: 3 },
          interests: { score: 0.8, matched: ['Data'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 0.6 }
        },
        what_you_gain: ['Hands-on experience', 'Data skills', 'Mentorship'],
        requirements: ['Python', 'SQL', 'Statistical knowledge'],
        eligibility: ['Recent graduates', 'Kenya'],
        created_at: '2026-08-20'
      },
      {
        id: 3,
        title: 'Product Design Intern (Remote)',
        organization_name: 'Innovation Hub',
        organization_logo: '💡',
        is_verified: true,
        is_demo: true,
        type: 'internship',
        description: 'Join our design team to create user-centric interfaces for educational apps.',
        skills_required: ['UI/UX', 'Figma', 'User Research'],
        interests: ['Design', 'Technology'],
        education_level: 'undergraduate',
        location: 'Remote',
        is_remote: true,
        deadline: '2026-09-25',
        match_score: 73,
        match_details: {
          skills: { score: 0.6, matched: ['UI/UX'], total: 3 },
          interests: { score: 0.8, matched: ['Design'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 0.7 }
        },
        what_you_gain: ['Portfolio projects', 'Mentorship', 'Certificate'],
        requirements: ['Figma', 'Portfolio'],
        eligibility: ['University students', 'Kenya'],
        created_at: '2026-08-18'
      },
      // ─── Scholarships & Learning ────────────────────────────────
      {
        id: 4,
        title: 'Future Innovators Scholarship',
        organization_name: 'Future Foundation',
        organization_logo: '🔮',
        is_verified: true,
        is_demo: true,
        type: 'scholarship',
        description: 'Full tuition support for technology and innovation students.',
        skills_required: ['Innovation', 'Critical Thinking'],
        interests: ['Education', 'Technology'],
        education_level: 'undergraduate',
        location: 'Global / Remote',
        is_remote: true,
        deadline: '2026-10-15',
        match_score: 92,
        match_details: {
          skills: { score: 1, matched: ['Innovation', 'Critical Thinking'], total: 2 },
          interests: { score: 1, matched: ['Education', 'Technology'], total: 2 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 1 }
        },
        what_you_gain: ['Full tuition support', 'Mentorship', 'Networking opportunities'],
        requirements: ['Academic excellence', 'Innovation mindset'],
        eligibility: ['University students', 'Kenya'],
        created_at: '2026-08-10'
      },
      {
        id: 5,
        title: 'AWS Cloud Practitioner Bootcamp',
        organization_name: 'Cloud Academy',
        organization_logo: '☁️',
        is_verified: true,
        is_demo: true,
        type: 'bootcamp',
        description: 'Intensive 4-week bootcamp preparing you for AWS Cloud Practitioner certification.',
        skills_required: ['Cloud Basics', 'Linux'],
        interests: ['Cloud', 'DevOps'],
        education_level: 'undergraduate',
        location: 'Virtual',
        is_remote: true,
        deadline: '2026-11-01',
        match_score: 68,
        match_details: {
          skills: { score: 0.5, matched: ['Cloud Basics'], total: 2 },
          interests: { score: 0.6, matched: ['Cloud'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 0.8 }
        },
        what_you_gain: ['AWS certification', 'Hands-on labs', 'Career guidance'],
        requirements: ['Basic IT knowledge'],
        eligibility: ['University students', 'Kenya'],
        created_at: '2026-08-22'
      },
      {
        id: 6,
        title: 'Women in STEM Fellowship',
        organization_name: 'Equal Access Initiative',
        organization_logo: '🌟',
        is_verified: true,
        is_demo: true,
        type: 'fellowship',
        description: 'A 6-month fellowship for women pursuing STEM careers, with mentorship and project funding.',
        skills_required: ['Leadership', 'Project Management'],
        interests: ['Women in Tech', 'Mentorship'],
        education_level: 'undergraduate',
        location: 'Kenya / Remote',
        is_remote: true,
        deadline: '2026-10-30',
        match_score: 81,
        match_details: {
          skills: { score: 0.8, matched: ['Leadership'], total: 2 },
          interests: { score: 0.9, matched: ['Women in Tech'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 1 }
        },
        what_you_gain: ['Mentorship', 'Project funding', 'Networking'],
        requirements: ['Female student', 'STEM field'],
        eligibility: ['University women', 'Kenya'],
        created_at: '2026-08-19'
      },
      // ─── Challenges ──────────────────────────────────────────────
      {
        id: 7,
        title: 'KEPSA Demo Challenge: Solve a Real Business Problem',
        organization_name: 'KEPSA',
        organization_logo: '🏢',
        is_verified: true,
        is_demo: true,
        type: 'challenge',
        description: 'Solve a real business problem and win KSh 100,000. This is a concept demo for KEPSA.',
        skills_required: ['Business', 'Technology', 'Innovation'],
        interests: ['Entrepreneurship', 'Problem Solving'],
        education_level: 'undergraduate',
        age_min: 18,
        location: 'Kenya',
        is_remote: false,
        deadline: '2026-10-20',
        match_score: 78,
        match_details: {
          skills: { score: 0.7, matched: ['Business', 'Technology'], total: 3 },
          interests: { score: 0.8, matched: ['Entrepreneurship'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 0.8 }
        },
        what_you_gain: ['KSh 100,000 prize', 'Industry exposure', 'Networking'],
        requirements: ['Team of 3-5', 'Business plan'],
        eligibility: ['Students', 'Kenya'],
        created_at: '2026-08-20'
      },
      {
        id: 8,
        title: 'Climate Action Hackathon',
        organization_name: 'GreenTech Kenya',
        organization_logo: '🌿',
        is_verified: true,
        is_demo: true,
        type: 'challenge',
        description: 'Build innovative solutions to combat climate change in Kenyan communities.',
        skills_required: ['Sustainability', 'IoT', 'Data Analysis'],
        interests: ['Environment', 'Technology'],
        education_level: 'undergraduate',
        location: 'Nairobi / Remote',
        is_remote: true,
        deadline: '2026-11-05',
        match_score: 65,
        match_details: {
          skills: { score: 0.5, matched: ['Sustainability'], total: 3 },
          interests: { score: 0.7, matched: ['Environment'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 0.5 }
        },
        what_you_gain: ['Cash prize', 'Incubation support', 'Mentorship'],
        requirements: ['Interest in climate', 'Team of 2-4'],
        eligibility: ['Students', 'Kenya'],
        created_at: '2026-08-25'
      },
      // ─── Mentorship ──────────────────────────────────────────────
      {
        id: 9,
        title: 'Women in Technology Mentorship',
        organization_name: 'Innovation Hub',
        organization_logo: '💡',
        is_verified: true,
        is_demo: true,
        type: 'mentorship',
        description: '6-week mentorship programme for women in technology.',
        skills_required: ['Leadership', 'Communication'],
        interests: ['Technology', 'Mentorship'],
        education_level: 'undergraduate',
        location: 'Kenya / Remote',
        is_remote: true,
        deadline: '2026-11-01',
        match_score: 82,
        match_details: {
          skills: { score: 0.8, matched: ['Leadership'], total: 2 },
          interests: { score: 0.8, matched: ['Technology'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 1 }
        },
        what_you_gain: ['Career mentorship', 'Industry talks', 'Networking'],
        requirements: ['Women students', 'Interest in technology'],
        eligibility: ['University students', 'Kenya'],
        created_at: '2026-08-18'
      },
      {
        id: 10,
        title: 'KUA Career Mentorship Program',
        organization_name: 'KUA Partners',
        organization_logo: '⚡',
        is_verified: true,
        is_demo: true,
        type: 'mentorship',
        description: 'Get paired with a senior professional in your field. 12-week program with weekly check-ins.',
        skills_required: ['Career Planning', 'Networking'],
        interests: ['Mentorship', 'Career Growth'],
        education_level: 'undergraduate',
        location: 'Virtual',
        is_remote: true,
        deadline: '2026-10-15',
        match_score: 85,
        match_details: {
          skills: { score: 0.9, matched: ['Career Planning'], total: 2 },
          interests: { score: 0.9, matched: ['Mentorship'], total: 1 },
          education: { score: 1, required: 'undergraduate', user: 'undergraduate' },
          goals: { score: 0.8 }
        },
        what_you_gain: ['Career guidance', 'Industry insights', 'Networking'],
        requirements: ['Active student', 'Career-oriented'],
        eligibility: ['University students', 'Kenya'],
        created_at: '2026-08-21'
      }
    ];
    setOpportunities(mockOpps);
    setFiltered(mockOpps);
    setMyApplications([]);
  };

  // ── Tab content filtering ──────────────────────────────────────────
  const getFilteredByType = useCallback((type) => {
    return opportunities.filter(o => o.type === type);
  }, [opportunities]);

  // ── Application handler ────────────────────────────────────────────
  const handleApply = async (oppId) => {
    setApplying(true);
    try {
      await api.applyOpportunity(oppId);
      // Refresh applications
      const apps = await api.getMyApplications();
      setMyApplications(apps || []);
      setShowDetail(false);
      alert('Application submitted successfully!');
    } catch (err) {
      alert('Failed to apply: ' + (err.error || err.message));
    } finally {
      setApplying(false);
    }
  };

  // ── Get application status ────────────────────────────────────────
  const getApplicationStatus = (oppId) => {
    const app = myApplications.find(a => a.opportunity_id === oppId);
    return app ? app.status : null;
  };

  // ── Get status badge color ────────────────────────────────────────
  const getStatusColor = (status) => {
    const colors = {
      'applied': 'bg-blue-500/20 text-blue-400',
      'under_review': 'bg-yellow-500/20 text-yellow-400',
      'shortlisted': 'bg-purple-500/20 text-purple-400',
      'interview': 'bg-orange-500/20 text-orange-400',
      'accepted': 'bg-green-500/20 text-green-400',
      'unsuccessful': 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  // ── Tab navigation ─────────────────────────────────────────────────
  const tabs = [
    { id: 'for-you', label: 'For You', icon: Sparkles },
    { id: 'jobs', label: 'Jobs & Internships', icon: Briefcase },
    { id: 'scholarships', label: 'Scholarships & Learning', icon: BookOpen },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
  ];

  // ── Render: For You tab ────────────────────────────────────────────
  const renderForYou = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/60">Recommended based on your profile</h3>
        <span className="text-xs text-brand-400">{filtered.length} opportunities</span>
      </div>
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-white/40">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No personalized opportunities yet</p>
          <p className="text-sm">Complete your profile to get better recommendations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(opp => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              onSelect={() => { setSelectedOpp(opp); setShowDetail(true); }}
              appStatus={getApplicationStatus(opp.id)}
              isDemo={opp.is_demo}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ── Render: Jobs & Internships ─────────────────────────────────────
  const renderJobs = () => {
    const jobs = opportunities.filter(o => ['job', 'internship'].includes(o.type));
    const categories = ['Internships', 'Graduate Opportunities', 'Jobs', 'Part-time', 'Remote', 'Entry-level'];
    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-3 py-1 rounded-full text-xs transition ${filters.category === cat ? 'bg-brand-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white/60'}`}
              onClick={() => setFilters({...filters, category: filters.category === cat ? '' : cat})}
            >
              {cat}
            </button>
          ))}
        </div>
        {jobs.length === 0 ? (
          <div className="card p-8 text-center text-white/40">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No jobs or internships yet</p>
            <p className="text-sm">Check back later for opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(opp => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                onSelect={() => { setSelectedOpp(opp); setShowDetail(true); }}
                appStatus={getApplicationStatus(opp.id)}
                isDemo={opp.is_demo}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render: Scholarships & Learning ───────────────────────────────
  const renderScholarships = () => {
    const items = opportunities.filter(o => ['scholarship', 'fellowship', 'bootcamp', 'certification', 'training', 'exchange'].includes(o.type));
    const types = ['Scholarships', 'Fellowships', 'Bootcamps', 'Certifications', 'Training', 'Exchange'];
    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {types.map(t => (
            <button
              key={t}
              className={`px-3 py-1 rounded-full text-xs transition ${filters.category === t ? 'bg-brand-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white/60'}`}
              onClick={() => setFilters({...filters, category: filters.category === t ? '' : t})}
            >
              {t}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="card p-8 text-center text-white/40">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No learning opportunities yet</p>
            <p className="text-sm">Explore scholarships, bootcamps, and more.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(opp => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                onSelect={() => { setSelectedOpp(opp); setShowDetail(true); }}
                appStatus={getApplicationStatus(opp.id)}
                isDemo={opp.is_demo}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render: Challenges ─────────────────────────────────────────────
  const renderChallenges = () => {
    const items = opportunities.filter(o => o.type === 'challenge');
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-white/60">Industry challenges from partner organizations</span>
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">🔥 New</span>
        </div>
        {items.length === 0 ? (
          <div className="card p-8 text-center text-white/40">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No challenges available yet</p>
            <p className="text-sm">Organizations will create challenges for you to solve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(opp => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                onSelect={() => { setSelectedOpp(opp); setShowDetail(true); }}
                appStatus={getApplicationStatus(opp.id)}
                isDemo={opp.is_demo}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render: Mentorship ─────────────────────────────────────────────
  const renderMentorship = () => {
    const items = opportunities.filter(o => o.type === 'mentorship');
    return (
      <div>
        <div className="mb-4">
          <p className="text-sm text-white/60">Connect with industry professionals for career guidance.</p>
        </div>
        {items.length === 0 ? (
          <div className="card p-8 text-center text-white/40">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No mentorship programmes yet</p>
            <p className="text-sm">Mentors will be available to guide your career.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(opp => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                onSelect={() => { setSelectedOpp(opp); setShowDetail(true); }}
                appStatus={getApplicationStatus(opp.id)}
                isDemo={opp.is_demo}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Detail Modal ──────────────────────────────────────────────────
  const renderDetailModal = () => {
    if (!selectedOpp) return null;
    const opp = selectedOpp;
    const status = getApplicationStatus(opp.id);
    const matchDetails = opp.match_details || {};

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowDetail(false)}>
        <div className="w-full max-w-3xl card p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{opp.organization_logo || '🏢'}</span>
                <div>
                  <h2 className="text-2xl font-bold">{opp.title}</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/60">{opp.organization_name}</span>
                    {opp.is_verified && <span className="text-brand-400">✓ Verified</span>}
                    {opp.is_demo && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">DEMO</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/40">
                <span className="flex items-center gap-1"><Clock size={14} /> Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {opp.location || 'Remote'}</span>
                {opp.is_remote && <span className="text-brand-400">🌐 Remote</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-400">{opp.match_score || 0}%</div>
              <div className="text-xs text-white/40">Match</div>
            </div>
            <button onClick={() => setShowDetail(false)} className="text-white/40 hover:text-white"><X size={24} /></button>
          </div>

          {/* Match Breakdown */}
          <div className="bg-white/5 p-4 rounded-lg mb-4">
            <h4 className="text-sm font-semibold text-white/60 mb-2">Why KUA matched you</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div><span className="text-white/60">Skills:</span> {matchDetails.skills?.score ? Math.round(matchDetails.skills.score * 100) : 0}%</div>
              <div><span className="text-white/60">Interests:</span> {matchDetails.interests?.score ? Math.round(matchDetails.interests.score * 100) : 0}%</div>
              <div><span className="text-white/60">Education:</span> {matchDetails.education?.score ? Math.round(matchDetails.education.score * 100) : 0}%</div>
              <div><span className="text-white/60">Goals:</span> {matchDetails.goals?.score ? Math.round(matchDetails.goals.score * 100) : 0}%</div>
            </div>
            <p className="text-xs text-white/40 mt-2">
              {opp.match_score && opp.match_score > 80 ? '🎯 You\'re a strong match! Continue to apply.' : '📈 Keep building your skills to increase your match score.'}
            </p>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h3 className="font-semibold mb-1">About</h3>
            <p className="text-sm text-white/70">{opp.description}</p>
          </div>

          {/* What you'll gain */}
          {opp.what_you_gain && opp.what_you_gain.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-1">What you'll gain</h3>
              <div className="flex flex-wrap gap-2">
                {opp.what_you_gain.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs">{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements & Eligibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {opp.requirements && opp.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-1">Requirements</h3>
                <ul className="text-sm text-white/60 space-y-1">
                  {opp.requirements.map((r, i) => <li key={i} className="flex items-center gap-1"><CheckCircle size={12} className="text-brand-400" /> {r}</li>)}
                </ul>
              </div>
            )}
            {opp.eligibility && opp.eligibility.length > 0 && (
              <div>
                <h3 className="font-semibold mb-1">Eligibility</h3>
                <ul className="text-sm text-white/60 space-y-1">
                  {opp.eligibility.map((e, i) => <li key={i} className="flex items-center gap-1"><CheckCircle size={12} className="text-green-400" /> {e}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Application Status & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            {status ? (
              <div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                  {status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs text-white/40 ml-2">Applied on {new Date(opp.applied_at).toLocaleDateString()}</span>
              </div>
            ) : (
              <button
                onClick={() => handleApply(opp.id)}
                disabled={applying}
                className="btn-primary flex items-center gap-2"
              >
                {applying ? <Loader2 className="animate-spin" size={16} /> : 'Apply Now →'}
              </button>
            )}
            {opp.application_link && (
              <a href={opp.application_link} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline text-sm flex items-center gap-1">
                External Application <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Demo label */}
          {opp.is_demo && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
              <AlertCircle size={12} className="inline mr-1" />
              This is a DEMO opportunity created to demonstrate how KUA's opportunity ecosystem will work once verified organizations join the platform.
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Partner with KUA Modal ────────────────────────────────────────
  const renderPartnerModal = () => {
    if (!showPartner) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowPartner(false)}>
        <div className="w-full max-w-md card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🤝 Partner with KUA</h2>
            <button onClick={() => setShowPartner(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
          </div>
          <p className="text-white/70 text-sm mb-4">
            Your next opportunity could be someone's first breakthrough.
          </p>
          <p className="text-white/60 text-sm mb-4">
            Partner with KUA to reach students through internships, challenges, mentorship, scholarships and industry programmes.
          </p>
          <div className="space-y-2 text-sm text-white/60">
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-400" /> Reach thousands of students</div>
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-400" /> Build your employer brand</div>
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-400" /> Find top talent</div>
          </div>
          <button className="btn-primary w-full mt-4">Become a Partner →</button>
          <button onClick={() => setShowPartner(false)} className="text-white/40 hover:text-white text-sm w-full mt-2">Maybe later</button>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────
  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-3xl font-bold">🚀 Opportunities</h1>
          <p className="text-white/40">Discover what's next for you.</p>
        </div>
        <button onClick={() => setShowPartner(true)} className="btn-secondary text-sm flex items-center gap-1">
          <Building size={16} /> Partner with KUA
        </button>
      </div>

      {/* Prototype banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mb-4 text-xs text-yellow-400 flex items-center gap-2">
        <AlertCircle size={14} />
        <span>Prototype Preview — These opportunities demonstrate how KUA's opportunity ecosystem will work once verified organizations join the platform.</span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-white/10 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 capitalize transition flex items-center gap-2 text-sm ${
                activeTab === tab.id
                  ? 'border-b-2 border-brand-500 text-white font-medium'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'for-you' && renderForYou()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'scholarships' && renderScholarships()}
        {activeTab === 'challenges' && renderChallenges()}
        {activeTab === 'mentorship' && renderMentorship()}
      </div>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Partner Modal */}
      {renderPartnerModal()}
    </div>
  );
}

// ── Opportunity Card Component ─────────────────────────────────────
function OpportunityCard({ opp, onSelect, appStatus, isDemo }) {
  const getTypeIcon = (type) => {
    const icons = {
      'job': '💼',
      'internship': '💼',
      'scholarship': '🎓',
      'challenge': '🏆',
      'mentorship': '🤝',
      'bootcamp': '💻',
      'fellowship': '🌟',
      'certification': '📜',
      'training': '📚',
      'exchange': '🌍'
    };
    return icons[type] || '📌';
  };

  return (
    <div
      className="card p-4 cursor-pointer hover:border-brand-400/30 transition group"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{opp.organization_logo || getTypeIcon(opp.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold group-hover:text-brand-400 transition">{opp.title}</h4>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>{opp.organization_name}</span>
                {opp.is_verified && <span className="text-brand-400">✓ Verified</span>}
                {isDemo && <span className="text-yellow-400">DEMO</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-lg font-bold text-brand-400">{opp.match_score || 0}%</div>
              <div className="text-[10px] text-white/30">Match</div>
            </div>
          </div>

          <p className="text-sm text-white/60 line-clamp-2 mt-1">{opp.description}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/40">{opp.type}</span>
            {opp.skills_required && opp.skills_required.slice(0, 3).map((skill, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded-full">{skill}</span>
            ))}
            {opp.skills_required && opp.skills_required.length > 3 && (
              <span className="text-[10px] text-white/40">+{opp.skills_required.length - 3}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/30">
            <span className="flex items-center gap-1"><MapPin size={12} /> {opp.location || 'Remote'}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(opp.deadline).toLocaleDateString()}</span>
            {appStatus && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(appStatus)}`}>
                {appStatus.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    'applied': 'bg-blue-500/20 text-blue-400',
    'under_review': 'bg-yellow-500/20 text-yellow-400',
    'shortlisted': 'bg-purple-500/20 text-purple-400',
    'interview': 'bg-orange-500/20 text-orange-400',
    'accepted': 'bg-green-500/20 text-green-400',
    'unsuccessful': 'bg-red-500/20 text-red-400'
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}