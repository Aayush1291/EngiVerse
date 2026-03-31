import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Loading from '../components/Loading.jsx';

const VerifyEmail = ({ showToast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyEmail = async (token) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      showToast('Email verified successfully!', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
      showToast('Verification failed', 'error');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100 text-center animate-fade-in">
          {status === 'success' ? (
            <>
              <div className="text-6xl mb-6 animate-bounce">✅</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h2>
              <p className="text-gray-600 mb-8 text-lg">{message}</p>
              <p className="text-sm text-gray-500 mb-6">Redirecting to login...</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg transform hover:scale-105"
              >
                Go to Login
              </Link>
            </>
          ) : (
            <>
              <div className="text-6xl mb-6">❌</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-8 text-lg">{message}</p>
              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg transform hover:scale-105"
                >
                  Go to Login
                </Link>
                <Link
                  to="/resend-verification"
                  className="block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Resend Verification Email
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

