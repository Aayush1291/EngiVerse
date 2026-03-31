import React from 'react';
import { Link } from 'react-router-dom';

const Error404 = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-2xl shadow-2xl p-12 border border-gray-100 max-w-md w-full">
        <div className="text-8xl font-bold text-primary-600 mb-4">404</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 text-lg">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg transform hover:scale-105"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default Error404;

