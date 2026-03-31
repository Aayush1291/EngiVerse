import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' 
    ? 'bg-green-500' 
    : type === 'error' 
    ? 'bg-red-500' 
    : 'bg-blue-500';

  const icon = type === 'success' 
    ? '✓' 
    : type === 'error' 
    ? '✕' 
    : 'ℹ';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-fade-in min-w-[300px] max-w-md`}>
      <span className="text-xl font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button 
        onClick={onClose} 
        className="text-white hover:text-gray-200 transition-colors text-xl font-bold"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

