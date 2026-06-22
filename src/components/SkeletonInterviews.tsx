import React from 'react';

const SkeletonCard = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg p-4">
    <div className="h-5 w-24 bg-gray-300 rounded mb-3" />
    <div className="h-5 w-40 bg-gray-300 rounded mb-3" />
    <div className="h-4 w-36 bg-gray-300 rounded mb-2" />
    <div className="h-4 w-28 bg-gray-300 rounded mb-2" />
    <div className="h-4 w-20 bg-gray-300 rounded" />
  </div>
);

const SkeletonInterviews = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gray-300 h-8 w-8 animate-pulse" />
          <div>
            <div className="h-5 w-32 bg-gray-300 rounded mb-2 animate-pulse" />
            <div className="h-3 w-20 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="h-7 w-48 bg-gray-300 rounded animate-pulse" />
        <div className="h-9 w-36 bg-gray-300 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonInterviews;
