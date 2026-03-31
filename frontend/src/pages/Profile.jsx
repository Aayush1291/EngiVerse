import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api';

const Profile = ({ showToast }) => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    college: '',
    company: '',
    skills: [],
    linkedin: '',
    github: '',
    website: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [badges, setBadges] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadProfile();
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      setProfile(response.data.user);
      setFormData({
        name: response.data.user.profile.name || '',
        bio: response.data.user.profile.bio || '',
        college: response.data.user.profile.college || '',
        company: response.data.user.profile.company || '',
        skills: response.data.user.profile.skills || [],
        linkedin: response.data.user.profile.linkedin || '',
        github: response.data.user.profile.github || '',
        website: response.data.user.profile.website || ''
      });
    } catch (error) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBadges = async () => {
    try {
      const response = await api.get('/badges/me');
      if (response.data.success) {
        setBadges(response.data.badges || []);
        setTotalPoints(response.data.totalPoints || 0);
      }
    } catch (error) {
      // Silently fail - badges are optional
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/profiles/me', formData);
      setProfile(response.data.user);
      updateUser(response.data.user);
      setEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const completion = profile?.profileCompletion || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-medium text-gray-700">{completion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              ></div>
            </div>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Badges Earned</h3>
                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-semibold">
                  {totalPoints} Points
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-shadow"
                    title={badge.description}
                  >
                    <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                    <div className="font-semibold text-sm text-gray-900 mb-1">{badge.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{badge.category}</div>
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      badge.rarity === 'Legendary' ? 'bg-purple-100 text-purple-800' :
                      badge.rarity === 'Epic' ? 'bg-blue-100 text-blue-800' :
                      badge.rarity === 'Rare' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {badge.rarity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  rows="4"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {user?.role === 'Student' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add a skill"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-primary-100 text-primary-800 font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-primary-600 hover:text-primary-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{profile?.profile?.name || 'N/A'}</h3>
                <p className="text-gray-600 mb-3">{profile?.email}</p>
                <span className="inline-block px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                  {profile?.role}
                </span>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-900">Bio</h4>
                <p className="text-gray-700 leading-relaxed">{profile?.profile?.bio || 'No bio provided'}</p>
              </div>

              {user?.role === 'Student' ? (
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">College</h4>
                  <p className="text-gray-700">{profile?.profile?.college || 'N/A'}</p>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Company</h4>
                  <p className="text-gray-700">{profile?.profile?.company || 'N/A'}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profile?.profile?.skills?.length > 0 ? (
                    profile.profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills added</p>
                  )}
                </div>
              </div>

              {(profile?.profile?.linkedin || profile?.profile?.github || profile?.profile?.website) && (
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">Links</h4>
                  <div className="space-y-2">
                    {profile.profile.linkedin && (
                      <a href={profile.profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 hover:underline block font-medium">
                        LinkedIn →
                      </a>
                    )}
                    {profile.profile.github && (
                      <a href={profile.profile.github} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 hover:underline block font-medium">
                        GitHub →
                      </a>
                    )}
                    {profile.profile.website && (
                      <a href={profile.profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 hover:underline block font-medium">
                        Website →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
