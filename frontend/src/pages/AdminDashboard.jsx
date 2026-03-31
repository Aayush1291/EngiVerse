import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Loading from '../components/Loading.jsx';
import Modal from '../components/Modal.jsx';

const AdminDashboard = ({ showToast }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [abandonedProjects, setAbandonedProjects] = useState([]);
  const [unverifiedProjects, setUnverifiedProjects] = useState([]);
  const [plagiarizedProjects, setPlagiarizedProjects] = useState([]);
  const [riskyUsers, setRiskyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.stats);
      setRecentProjects(response.data.recentProjects || []);
      setRecentUsers(response.data.recentUsers || []);
      setAbandonedProjects(response.data.abandonedProjects || []);
      setUnverifiedProjects(response.data.unverifiedProjects || []);
      setPlagiarizedProjects(response.data.plagiarizedProjects || []);
      setRiskyUsers(response.data.riskyUsers || []);
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProject = async (projectId) => {
    try {
      showToast('Running AI verification...', 'info');
      const response = await api.post(`/admin/projects/${projectId}/verify`);
      if (response.data.verified) {
        showToast('Project verified by AI successfully', 'success');
      } else {
        showToast(`AI verification: ${response.data.reason || 'Not verified'}`, 'warning');
      }
      setShowProjectModal(false);
      setVerificationNotes('');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to verify project', 'error');
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      showToast('Running AI verification...', 'info');
      const response = await api.post(`/admin/users/${userId}/verify-profile`);
      if (response.data.verified) {
        showToast('Profile verified by AI successfully', 'success');
      } else {
        showToast(`AI verification: ${response.data.reason || 'Not verified'}`, 'warning');
      }
      setShowUserModal(false);
      loadData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to verify user', 'error');
    }
  };

  const handleCheckPlagiarism = async (projectId) => {
    try {
      await api.post(`/admin/projects/${projectId}/check-plagiarism`);
      showToast('Plagiarism check completed', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to check plagiarism', 'error');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/admin/projects/${projectId}`);
      showToast('Project deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete all their projects.')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      showToast('User deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Full System Control & Verification Panel</p>
          <p className="text-sm text-gray-500 mt-1">Welcome, {user?.email} - You have full administrative access</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['overview', 'projects', 'users', 'verification', 'plagiarism', 'risky'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'projects') {
                  navigate('/admin/projects');
                } else {
                  setActiveTab(tab);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                <p className="text-4xl font-bold">{stats.users?.total || 0}</p>
                <p className="text-sm mt-2 opacity-90">
                  {stats.users?.verified || 0} verified • {stats.users?.emailVerified || 0} email verified
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Total Projects</h3>
                <p className="text-4xl font-bold">{stats.projects?.total || 0}</p>
                <p className="text-sm mt-2 opacity-90">
                  {stats.projects?.verified || 0} verified • {stats.projects?.total - (stats.projects?.verified || 0)} pending
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Collaborations</h3>
                <p className="text-4xl font-bold">{stats.collaborations?.total || 0}</p>
                <p className="text-sm mt-2 opacity-90">
                  {stats.collaborations?.pending || 0} pending • {stats.collaborations?.accepted || 0} accepted
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Issues</h3>
                <p className="text-4xl font-bold">{stats.plagiarizedProjectsCount + stats.riskyUsersCount || 0}</p>
                <p className="text-sm mt-2 opacity-90">
                  {stats.plagiarizedProjectsCount || 0} plagiarized • {stats.riskyUsersCount || 0} risky users
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Unverified Projects</h3>
              <p className="text-3xl font-bold text-orange-600 mb-2">{unverifiedProjects.length}</p>
              <button
                onClick={() => setActiveTab('verification')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Review Now →
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">View All Projects</h3>
              <p className="text-sm text-gray-600 mb-4">Complete project management</p>
              <button
                onClick={() => navigate('/admin/projects')}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                View All Projects →
              </button>
            </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Plagiarized Projects</h3>
                <p className="text-3xl font-bold text-red-600 mb-2">{plagiarizedProjects.length}</p>
                <button
                  onClick={() => setActiveTab('plagiarism')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Review Now →
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Risky Users</h3>
                <p className="text-3xl font-bold text-yellow-600 mb-2">{riskyUsers.length}</p>
                <button
                  onClick={() => setActiveTab('risky')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Review Now →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">All Projects</h2>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Owner: {project.owner?.profile?.name || project.owner?.email}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            project.verification?.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {project.verification?.verified ? '✓ Verified' : 'Unverified'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            project.plagiarismCheck?.isPlagiarized ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {project.plagiarismCheck?.isPlagiarized ? '⚠ Plagiarized' : '✓ Original'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${project._id}`)}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">All Users</h2>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{user.profile?.name || user.email}</h3>
                      <p className="text-sm text-gray-600 mt-1">Email: {user.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                        {user.profile?.verified && (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">✓ Verified</span>
                        )}
                        {user.emailVerified && (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">✓ Email Verified</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Unverified Projects</h2>
            <div className="space-y-4">
              {unverifiedProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">All projects are verified!</p>
              ) : (
                unverifiedProjects.map((project) => (
                  <div key={project._id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Owner: {project.owner?.profile?.name || project.owner?.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyProject(project._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          title="Run AI Verification"
                        >
                          AI Verify
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectModal(true);
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Plagiarism Tab */}
        {activeTab === 'plagiarism' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Plagiarized Projects</h2>
            <div className="space-y-4">
              {plagiarizedProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No plagiarized projects found!</p>
              ) : (
                plagiarizedProjects.map((project) => (
                  <div key={project._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Similarity: {project.plagiarismCheck?.similarityScore || 0}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Owner: {project.owner?.profile?.name || project.owner?.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCheckPlagiarism(project._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Re-check
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Risky Users Tab */}
        {activeTab === 'risky' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Risky Users</h2>
            <div className="space-y-4">
              {riskyUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No risky users found!</p>
              ) : (
                riskyUsers.map((item) => (
                  <div key={item.user._id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.user.profile?.name || item.user.email}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Risk Score: {item.riskScore}/100</p>
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-gray-700">Issues:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {item.reasons?.slice(0, 3).map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyUser(item.user._id, false)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Flag
                        </button>
                        <button
                          onClick={() => handleDeleteUser(item.user._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Project Management Modal */}
        <Modal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
          title="Project Details"
          size="large"
        >
          {selectedProject && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                <p className="text-sm text-gray-600">Owner: {selectedProject.owner?.profile?.name || selectedProject.owner?.email}</p>
                <p className="text-sm text-gray-600">Domain: {selectedProject.domain}</p>
                <p className="text-sm text-gray-600">Status: {selectedProject.status}</p>
              </div>

              {/* Verification Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">AI Verification Status</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded text-sm ${
                    selectedProject.verification?.verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedProject.verification?.verified ? '✓ Verified' : '✗ Not Verified'}
                  </span>
                  {selectedProject.verification?.aiAnalysis?.confidence && (
                    <span className="text-sm text-gray-600">
                      Confidence: {selectedProject.verification.aiAnalysis.confidence}%
                    </span>
                  )}
                </div>
                {selectedProject.verification?.notes && (
                  <p className="text-sm text-gray-600 mt-2">{selectedProject.verification.notes}</p>
                )}
                {selectedProject.verification?.aiAnalysis?.reason && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Reason:</strong> {selectedProject.verification.aiAnalysis.reason}
                  </p>
                )}
              </div>

              {/* AI Verification Actions */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Note:</strong> Verification is performed automatically by AI. You can trigger a re-verification below.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyProject(selectedProject._id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Run AI Verification
                  </button>
                  <button
                    onClick={() => handleCheckPlagiarism(selectedProject._id)}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                  >
                    Check Plagiarism
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* User Management Modal */}
        <Modal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          title="User Details"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedUser.profile?.name || selectedUser.email}</h3>
                <p className="text-sm text-gray-600">Email: {selectedUser.email}</p>
                <p className="text-sm text-gray-600">Role: {selectedUser.role}</p>
              </div>

              {/* Verification Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">AI Verification Status</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded text-sm ${
                    selectedUser.profile?.verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.profile?.verified ? '✓ Verified' : '✗ Not Verified'}
                  </span>
                  {selectedUser.profile?.aiVerification?.confidence && (
                    <span className="text-sm text-gray-600">
                      Confidence: {selectedUser.profile.aiVerification.confidence}%
                    </span>
                  )}
                </div>
                {selectedUser.profile?.verificationNotes && (
                  <p className="text-sm text-gray-600 mt-2">{selectedUser.profile.verificationNotes}</p>
                )}
                {selectedUser.profile?.aiVerification?.reason && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Reason:</strong> {selectedUser.profile.aiVerification.reason}
                  </p>
                )}
              </div>

              {/* AI Verification Actions */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Note:</strong> Verification is performed automatically by AI. You can trigger a re-verification below.
                </p>
                <button
                  onClick={() => handleVerifyUser(selectedUser._id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Run AI Verification
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AdminDashboard;
