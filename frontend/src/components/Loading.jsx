import React from 'react';

const Loading = ({ message = 'Loading...', fullScreen = true }) => {
  const containerClass = fullScreen ? 'min-h-screen' : 'min-h-[400px]';
  
  return (
    <div className={`${containerClass} flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100`}>
      <div className="text-center animate-fade-in">
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600 mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary-600 animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-600 text-lg font-medium animate-pulse-slow">{message}</p>
        <div className="mt-4 flex justify-center gap-1">
          <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;

