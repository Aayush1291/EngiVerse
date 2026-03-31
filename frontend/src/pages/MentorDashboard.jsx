import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api';
import Loading from '../components/Loading.jsx';

const MentorDashboard = ({ showToast }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/mentor/dashboard');
      setProjects(response.data.projects);
      setStats(response.data.stats);
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">Mentor Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, {user?.email}!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Projects</h3>
            <p className="text-4xl font-bold text-primary-600">{stats.totalProjects}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Projects</h3>
            <p className="text-4xl font-bold text-primary-600">{stats.activeProjects}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Completed</h3>
            <p className="text-4xl font-bold text-primary-600">{stats.completedProjects}</p>
          </div>
        </div>

        {/* Assigned Projects */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Assigned Projects</h2>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <p className="text-gray-500 text-lg">You haven't been assigned to any projects yet.</p>
              <Link
                to="/projects"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Browse Projects →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 hover:bg-gray-50 p-4 rounded-lg transition-colors">
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
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Owner: {project.owner?.profile?.name || project.owner?.email}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/projects/${project._id}`}
                      className="inline-block text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
