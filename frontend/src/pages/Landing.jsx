import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Landing = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'Student':
        return '/dashboard/student';
      case 'Mentor':
        return '/dashboard/mentor';
      case 'Investor':
        return '/dashboard/investor';
      case 'Admin':
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              ENGIVERSE
            </h1>
            <p className="text-xl md:text-2xl mb-4 font-light">Engineering Project Collaboration Platform</p>
            <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Connect students, mentors, and investors to build innovative engineering projects together.
              Collaborate, learn, and bring your ideas to life.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to={getDashboardLink()}
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transform hover:scale-105 transition-all duration-200"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">Features</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Everything you need to collaborate and succeed</p>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-6">👥</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Collaboration</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with other students and work together on exciting engineering projects. Build your network and learn from peers.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-6">🎓</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Mentorship</h3>
              <p className="text-gray-600 leading-relaxed">
                Get guidance from experienced mentors to accelerate your project development. Learn industry best practices and avoid common pitfalls.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-6">💡</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                Showcase your projects to investors and turn your ideas into reality. Get funding and support for your innovative solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">Who Can Join?</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Choose your role and start collaborating</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Students</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Create projects, collaborate with peers, and build your portfolio. Gain real-world experience.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Mentors</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Guide students and help them succeed in their engineering journey. Share your expertise.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Investors</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Discover promising projects and connect with innovative teams. Find the next big idea.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Admins</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Manage the platform and ensure smooth operations. Keep the community thriving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">Join ENGIVERSE today and start collaborating on amazing projects!</p>
          {!isAuthenticated && (
            <Link
              to="/signup"
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Sign Up Now
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;

