import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api';
import Loading from '../components/Loading.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';

const AdminProjects = ({ showToast }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    domain: '',
    search: '',
    verified: ''
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filters]);

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.domain) queryParams.append('domain', filters.domain);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', currentPage);
      queryParams.append('limit', 20);

      const response = await api.get(`/admin/projects?${queryParams.toString()}`);
      let allProjects = response.data.projects || [];

      // Filter by verification status if specified
      if (filters.verified === 'verified') {
        allProjects = allProjects.filter(p => p.verification?.verified === true);
      } else if (filters.verified === 'unverified') {
        allProjects = allProjects.filter(p => !p.verification?.verified);
      }

      setProjects(allProjects);
      setPagination(response.data.pagination);
    } catch (error) {
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      await api.delete(`/admin/projects/${projectId}`);
      showToast('Project deleted successfully', 'success');
      loadProjects();
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  const handleVerifyProject = async (projectId) => {
    try {
      showToast('Running AI verification...', 'info');
      const response = await api.post(`/admin/projects/${projectId}/verify`);
      if (response.data.verified) {
        showToast('Project verified by AI', 'success');
      } else {
        showToast(`AI verification: ${response.data.reason || 'Not verified'}`, 'warning');
      }
      loadProjects();
    } catch (error) {
      showToast('Failed to verify project', 'error');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">All Projects</h1>
          <p className="text-gray-600">Complete view of all projects in the system</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Adopted">Adopted</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <select
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All Domains</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="AI/ML">AI/ML</option>
                <option value="IoT">IoT</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Data Science">Data Science</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
              <select
                value={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-500 text-lg">No projects found</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex-1">{project.title}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.verification?.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {project.verification?.verified ? '✓ Verified' : '✗ Unverified'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {project.domain}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                    {project.difficulty}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    project.status === 'Open' ? 'bg-green-100 text-green-800' :
                    project.status === 'Adopted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Owner:</strong> {project.owner?.profile?.name || project.owner?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Health Score:</strong> {project.healthScore || 0}/100
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Collaborators:</strong> {project.collaborators?.length || 0}
                  </p>
                </div>

                {project.verification?.aiAnalysis && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>AI Confidence:</strong> {project.verification.aiAnalysis.confidence}%
                    </p>
                    {project.verification.aiAnalysis.reason && (
                      <p className="text-xs text-gray-600 mt-1">
                        {project.verification.aiAnalysis.reason.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            loading={loading}
          />
        )}

        {/* Project Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProject(null);
          }}
          title="Project Details"
          size="large"
        >
          {selectedProject && (
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">{selectedProject.title}</h3>
                <p className="text-gray-600">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Domain</p>
                  <p className="text-gray-600">{selectedProject.domain}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Difficulty</p>
                  <p className="text-gray-600">{selectedProject.difficulty}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Status</p>
                  <p className="text-gray-600">{selectedProject.status}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Health Score</p>
                  <p className="text-gray-600">{selectedProject.healthScore || 0}/100</p>
                </div>
              </div>

              {selectedProject.verification && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">AI Verification Status</h4>
                  <p className="text-sm">
                    <strong>Verified:</strong> {selectedProject.verification.verified ? 'Yes' : 'No'}
                  </p>
                  {selectedProject.verification.aiAnalysis && (
                    <>
                      <p className="text-sm">
                        <strong>Confidence:</strong> {selectedProject.verification.aiAnalysis.confidence}%
                      </p>
                      <p className="text-sm">
                        <strong>Reason:</strong> {selectedProject.verification.aiAnalysis.reason}
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleVerifyProject(selectedProject._id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Run AI Verification
                </button>
                <button
                  onClick={() => navigate(`/projects/${selectedProject._id}`)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                >
                  View Full Project
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AdminProjects;

