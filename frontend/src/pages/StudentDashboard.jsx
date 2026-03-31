import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api';
import Loading from '../components/Loading.jsx';

const StudentDashboard = ({ showToast }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myProjects: 0,
    collaborations: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, requestsRes] = await Promise.all([
        api.get(`/projects?owner=${user.id || user._id}`),
        api.get('/collaborations/my-requests')
      ]);

      setProjects(projectsRes.data.projects);
      setRequests(requestsRes.data.requests);
      
      setStats({
        myProjects: projectsRes.data.projects.length,
        collaborations: projectsRes.data.projects.reduce((acc, p) => acc + (p.collaborators?.length || 0), 0),
        pendingRequests: requestsRes.data.requests.filter(r => r.status === 'Pending').length
      });
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, {user?.email}!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">My Projects</h3>
            <p className="text-4xl font-bold text-primary-600">{stats.myProjects}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Collaborators</h3>
            <p className="text-4xl font-bold text-primary-600">{stats.collaborations}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Requests</h3>
            <p className="text-4xl font-bold text-primary-600">{stats.pendingRequests}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <Link
            to="/projects/create"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg text-center"
          >
            + Create New Project
          </Link>
          <Link
            to="/projects"
            className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold transform hover:scale-105 transition-all duration-200 text-center"
          >
            Explore Projects
          </Link>
        </div>

        {/* My Projects */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">My Projects</h2>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-500 text-lg">You haven't created any projects yet.</p>
              <Link
                to="/projects/create"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Create your first project →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 hover:bg-gray-50 p-4 rounded-lg transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <Link to={`/projects/${project._id}`} className="text-xl font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                        {project.title}
                      </Link>
                      <p className="text-gray-600 mt-2 leading-relaxed">{project.description.substring(0, 150)}...</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                          {project.domain}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {project.status}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {project.collaborators?.length || 0} collaborators
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/projects/${project._id}/edit`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collaboration Requests */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">My Collaboration Requests</h2>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📨</div>
              <p className="text-gray-500 text-lg">You haven't sent any collaboration requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="border-b border-gray-200 pb-4 last:border-b-0 hover:bg-gray-50 p-4 rounded-lg transition-colors">
                  <Link to={`/projects/${request.project._id}`} className="text-lg font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                    {request.project.title}
                  </Link>
                  <p className="text-gray-600 mt-2">Status: 
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
