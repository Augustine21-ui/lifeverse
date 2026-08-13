import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const EDUCATION_LEVELS = [
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'college', label: 'College' },
  { value: 'university', label: 'University' },
  { value: 'other', label: 'Other' },
];

const DYNAMIC_FIELDS = {
  primary: [
    { key: 'gradeFormYear', label: 'Grade', type: 'text' },
    { key: 'studentNumber', label: 'Student Number', type: 'text', optional: true },
  ],
  secondary: [
    { key: 'gradeFormYear', label: 'Form/Grade', type: 'text' },
    { key: 'admissionNumber', label: 'Admission Number', type: 'text', optional: true },
  ],
  college: [
    { key: 'courseDegree', label: 'Course', type: 'text' },
    { key: 'gradeFormYear', label: 'Year of Study', type: 'text' },
    { key: 'registrationNumber', label: 'Registration Number', type: 'text' },
  ],
  university: [
    { key: 'courseDegree', label: 'Degree Program', type: 'text' },
    { key: 'gradeFormYear', label: 'Year of Study', type: 'text' },
    { key: 'registrationNumber', label: 'Registration Number', type: 'text' },
  ],
  other: [
    { key: 'courseDegree', label: 'Area of Study', type: 'text', optional: true },
  ],
};

export default function AcademicOnboarding() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true); // initial load
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    countryId: '',
    educationLevel: '',
    institutionId: '',
    institutionName: '',
    curriculumId: '',
    gradeFormYear: '',
    courseDegree: '',
    studentNumber: '',
    admissionNumber: '',
    registrationNumber: '',
    preferredSubjects: [],
    learningGoals: '',
    dailyStudyHours: 2,
    reminderPreferences: {},
  });

  // Load countries and existing academic info
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [countriesData, existingInfo] = await Promise.all([
          api.getCountries(),
          api.getAcademicInfo().catch(() => null),
        ]);
        setCountries(countriesData);

        // If the user already has academic info, pre-fill the form
        if (existingInfo) {
          setFormData({
            countryId: existingInfo.country_id || '',
            educationLevel: existingInfo.education_level || '',
            institutionId: existingInfo.institution_id || '',
            institutionName: existingInfo.institution_name || '',
            curriculumId: existingInfo.curriculum_id || '',
            gradeFormYear: existingInfo.grade_form_year || '',
            courseDegree: existingInfo.course_degree || '',
            studentNumber: existingInfo.student_number || '',
            admissionNumber: existingInfo.admission_number || '',
            registrationNumber: existingInfo.registration_number || '',
            preferredSubjects: existingInfo.preferred_subjects || [],
            learningGoals: existingInfo.learning_goals || '',
            dailyStudyHours: existingInfo.daily_study_hours || 2,
            reminderPreferences: existingInfo.reminder_preferences || {},
          });
          // If institution name is known, set search query to show it
          if (existingInfo.institution_name) {
            setSearchQuery(existingInfo.institution_name);
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        showToast('Failed to load academic info', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load institutions when search changes
  const loadInstitutions = async (search) => {
    if (!search || search.length < 2) {
      setInstitutions([]);
      return;
    }
    try {
      const data = await api.getInstitutions({ search, countryId: formData.countryId || undefined });
      setInstitutions(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load curricula when country/education level changes
  useEffect(() => {
    if (!formData.countryId || !formData.educationLevel) return;
    const loadCurriculaData = async () => {
      try {
        const data = await api.getCurricula({
          countryId: formData.countryId,
          educationLevel: formData.educationLevel,
        });
        setCurricula(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadCurriculaData();
  }, [formData.countryId, formData.educationLevel]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!showManualEntry) {
      loadInstitutions(query);
    }
  };

  const handleInstitutionSelect = (inst) => {
    handleChange('institutionId', inst.id);
    setSearchQuery(inst.name);
    setInstitutions([]);
    // Also save the name for display
    handleChange('institutionName', inst.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Ensure institutionId or institutionName is set
    const payload = {
      ...formData,
      // If manual entry, use institutionName; if selected, use institutionId
      institutionName: formData.institutionName || searchQuery,
    };

    // If manual entry, clear institutionId so backend uses name
    if (showManualEntry) {
      payload.institutionId = null;
    } else {
      // Ensure we have an ID
      if (!payload.institutionId) {
        showToast('Please select an institution from the list or use manual entry.', 'error');
        setSaving(false);
        return;
      }
    }

    try {
      await api.saveAcademicInfo(payload);
      await refreshUser();
      showToast('Academic setup saved!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentFields = DYNAMIC_FIELDS[formData.educationLevel] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-700 p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-700 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/10">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          {formData.countryId ? 'Update Academic Setup' : 'Academic Setup'}
        </h1>
        <p className="text-white/60 text-center mb-8">
          {formData.countryId
            ? 'Update your learning environment details'
            : 'Let\'s set up your learning environment'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country & Education Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/80 text-sm font-medium">Country</label>
              <select
                value={formData.countryId}
                onChange={(e) => handleChange('countryId', e.target.value)}
                className="w-full input mt-1"
                required
              >
                <option value="">Select country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium">Education Level</label>
              <select
                value={formData.educationLevel}
                onChange={(e) => handleChange('educationLevel', e.target.value)}
                className="w-full input mt-1"
                required
              >
                <option value="">Select level</option>
                {EDUCATION_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Institution */}
          <div>
            <label className="text-white/80 text-sm font-medium">Institution</label>
            <div className="relative">
              <input
                type="text"
                value={showManualEntry ? formData.institutionName : searchQuery}
                onChange={(e) => {
                  if (showManualEntry) {
                    handleChange('institutionName', e.target.value);
                  } else {
                    handleSearch(e.target.value);
                  }
                }}
                placeholder="Search for your school or university..."
                className="w-full input mt-1"
                required={!showManualEntry}
              />
              {!showManualEntry && institutions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {institutions.map(inst => (
                    <li
                      key={inst.id}
                      className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white text-sm"
                      onClick={() => handleInstitutionSelect(inst)}
                    >
                      {inst.name} {inst.type && `(${inst.type})`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowManualEntry(!showManualEntry);
                if (!showManualEntry) {
                  // Switching to manual: clear institutionId and use name
                  handleChange('institutionId', '');
                } else {
                  // Switching to search: clear name and use search
                  handleChange('institutionName', '');
                  setSearchQuery('');
                }
              }}
              className="text-brand-400 text-sm hover:underline mt-1"
            >
              {showManualEntry ? 'Search instead' : "My institution isn't listed"}
            </button>
          </div>

          {/* Dynamic Fields */}
          {formData.educationLevel && (
            <div className="space-y-4">
              {formData.educationLevel !== 'other' && (
                <div>
                  <label className="text-white/80 text-sm font-medium">Curriculum</label>
                  <select
                    value={formData.curriculumId}
                    onChange={(e) => handleChange('curriculumId', e.target.value)}
                    className="w-full input mt-1"
                    required={formData.educationLevel !== 'other'}
                  >
                    <option value="">Select curriculum</option>
                    {curricula.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {currentFields.map(field => (
                <div key={field.key}>
                  <label className="text-white/80 text-sm font-medium">
                    {field.label} {field.optional && <span className="text-white/40 text-xs">(Optional)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full input mt-1"
                    required={!field.optional}
                  />
                </div>
              ))}

              <div>
                <label className="text-white/80 text-sm font-medium">Daily Study Hours</label>
                <input
                  type="number"
                  value={formData.dailyStudyHours}
                  onChange={(e) => handleChange('dailyStudyHours', parseInt(e.target.value) || 0)}
                  className="w-full input mt-1"
                  min="0"
                  max="24"
                  required
                />
              </div>

              <div>
                <label className="text-white/80 text-sm font-medium">Learning Goals</label>
                <textarea
                  value={formData.learningGoals}
                  onChange={(e) => handleChange('learningGoals', e.target.value)}
                  className="w-full input mt-1"
                  rows="3"
                  placeholder="What do you want to achieve?"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : formData.countryId ? 'Update' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}