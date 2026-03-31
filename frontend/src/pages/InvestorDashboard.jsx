import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api';
import Loading from '../components/Loading.jsx';

const InvestorDashboard = ({ showToast }) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookmarks = async () => {
    try {
      const response = await api.get('/investor/bookmarks');
      setBookmarks(response.data.bookmarks);
    } catch (error) {
      showToast('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (projectId) => {
    try {
      await api.delete(`/investor/bookmark/${projectId}`);
      setBookmarks(bookmarks.filter(b => b.project._id !== projectId));
      showToast('Bookmark removed', 'success');
    } catch (error) {
      showToast('Failed to remove bookmark', 'error');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900">Investor Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, {user?.email}!</p>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <Link
            to="/projects"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Browse Projects
          </Link>
        </div>

        {/* Bookmarked Projects */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Bookmarked Projects</h2>
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔖</div>
              <p className="text-gray-500 text-lg">You haven't bookmarked any projects yet.</p>
              <Link
                to="/projects"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Browse Projects →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookmarks.map((bookmark) => (
                <div key={bookmark._id} className="border-b border-gray-200 pb-6 last:border-b-0 hover:bg-gray-50 p-4 rounded-lg transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <Link to={`/projects/${bookmark.project._id}`} className="text-xl font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                        {bookmark.project.title}
                      </Link>
                      <p className="text-gray-600 mt-2 leading-relaxed">{bookmark.project.description?.substring(0, 150)}...</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                          {bookmark.project.domain}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {bookmark.project.status}
                        </span>
                      </div>
                      {bookmark.notes && (
                        <p className="text-sm text-gray-500 mt-3 p-3 bg-gray-50 rounded-lg">
                          <span className="font-semibold">Notes:</span> {bookmark.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/projects/${bookmark.project._id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleRemoveBookmark(bookmark.project._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
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

export default InvestorDashboard;
