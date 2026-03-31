import React from 'react';

const Skeleton = ({ className = '', lines = 1, width = '100%' }) => {
  if (lines === 1) {
    return (
      <div 
        className={`skeleton rounded h-4 ${className}`}
        style={{ width }}
      ></div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`skeleton rounded h-4 ${className}`}
          style={{ 
            width: index === lines - 1 ? '80%' : '100%' 
          }}
        ></div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
      <div className="skeleton h-6 w-3/4 mb-4 rounded"></div>
      <div className="skeleton h-4 w-full mb-2 rounded"></div>
      <div className="skeleton h-4 w-5/6 mb-4 rounded"></div>
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-6 w-20 rounded-full"></div>
        <div className="skeleton h-6 w-24 rounded-full"></div>
      </div>
      <div className="skeleton h-10 w-32 rounded"></div>
    </div>
  );
};

export const ProjectCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
      <div className="skeleton h-6 w-2/3 mb-3 rounded"></div>
      <div className="skeleton h-4 w-full mb-2 rounded"></div>
      <div className="skeleton h-4 w-4/5 mb-4 rounded"></div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="skeleton h-6 w-16 rounded-full"></div>
        <div className="skeleton h-6 w-20 rounded-full"></div>
        <div className="skeleton h-6 w-18 rounded-full"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="skeleton h-8 w-24 rounded"></div>
        <div className="skeleton h-8 w-20 rounded"></div>
      </div>
    </div>
  );
};

export default Skeleton;

