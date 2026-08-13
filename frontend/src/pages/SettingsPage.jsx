import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ArrowLeft, Save, Bell, Moon, Sun, Globe, Shield, ChevronRight, User, BookOpen, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: true,
    language: 'en',
    dailyReminder: '09:00',
    weeklyReport: true,
    pushNotifications: true,
  });

  // Load settings from localStorage and backend
  useEffect(() => {
    // In SettingsPage.jsx, update the loadSettings function:
    const loadSettings = async () => {
      try {
        // Load from localStorage first
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          setSettings(prev => ({ ...prev, darkMode: savedDarkMode === 'true' }));
        }

        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
          setSettings(prev => ({ ...prev, language: savedLanguage }));
        }

        const savedReminder = localStorage.getItem('dailyReminder');
        if (savedReminder) {
          setSettings(prev => ({ ...prev, dailyReminder: savedReminder }));
        }

        // Try to load from backend – if it fails (404), just use localStorage
        try {
          const data = await api.getSettings?.();
          if (data) {
            setSettings(prev => ({ ...prev, ...data }));
          }
        } catch (e) {
          // Backend endpoint doesn't exist yet – that's fine
          console.log('Settings endpoint not available, using localStorage only');
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Apply dark mode when it changes
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', settings.darkMode.toString());
  }, [settings.darkMode]);

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('darkMode', settings.darkMode.toString());
      localStorage.setItem('language', settings.language);
      localStorage.setItem('dailyReminder', settings.dailyReminder);

      // Save to backend if endpoint exists
      try {
        if (api.updateSettings) {
          await api.updateSettings(settings);
        }
      } catch (e) {
        // Backend might not have settings endpoint yet
      }

      showToast('Settings saved successfully!', 'success');
      await refreshUser();
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setSettings(prev => ({ ...prev, language: lang }));
    localStorage.setItem('language', lang);
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="card p-6">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <Sun size={20} className="text-yellow-400" /> Appearance
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Dark Mode</span>
              <button
                onClick={() => toggleSetting('darkMode')}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${settings.darkMode ? 'bg-brand-500' : 'bg-gray-600'}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <Bell size={20} className="text-blue-400" /> Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Email Notifications</span>
                <button
                  onClick={() => toggleSetting('emailNotifications')}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${settings.emailNotifications ? 'bg-brand-500' : 'bg-gray-600'}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Push Notifications</span>
                <button
                  onClick={() => toggleSetting('pushNotifications')}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${settings.pushNotifications ? 'bg-brand-500' : 'bg-gray-600'}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.pushNotifications ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80 flex items-center gap-2">
                  <Clock size={16} /> Daily Reminder
                </span>
                <input
                  type="time"
                  value={settings.dailyReminder}
                  onChange={(e) => handleChange('dailyReminder', e.target.value)}
                  className="input text-sm w-32"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Weekly Progress Report</span>
                <button
                  onClick={() => toggleSetting('weeklyReport')}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${settings.weeklyReport ? 'bg-brand-500' : 'bg-gray-600'}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.weeklyReport ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="card p-6">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <Globe size={20} className="text-green-400" /> Language
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'en', label: 'English', flag: '🇬🇧' },
                { code: 'sw', label: 'Swahili', flag: '🇰🇪' },
                { code: 'fr', label: 'French', flag: '🇫🇷' },
                { code: 'es', label: 'Spanish', flag: '🇪🇸' },
                { code: 'de', label: 'German', flag: '🇩🇪' },
                { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    settings.language === lang.code
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-2">Current language: {settings.language.toUpperCase()}</p>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <Shield size={20} className="text-purple-400" /> Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/academic-onboarding"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-white/80 hover:text-white"
              >
                <span className="flex items-center gap-2"><BookOpen size={16} /> Update Academic Info</span>
                <ChevronRight size={16} className="text-white/30" />
              </Link>
              <Link
                to="/profile"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-white/80 hover:text-white"
              >
                <span className="flex items-center gap-2"><User size={16} /> View Profile</span>
                <ChevronRight size={16} className="text-white/30" />
              </Link>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <><Save size={18} /> Save Settings</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}