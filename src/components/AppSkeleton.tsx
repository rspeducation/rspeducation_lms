import React from 'react';

interface AppSkeletonProps {
  variant?: 'dashboard' | 'interviews' | 'course' | 'admin-interviews';
  gridCount?: number;
}

/* Dashboard Card Skeleton */
const SkeletonCardDashboard = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg p-3 mb-6">
    <div className="h-24 md:h-32 bg-gray-300 rounded mb-3" />
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-300 rounded w-1/2" />
  </div>
);

/* Student Interview Card Skeleton */
const SkeletonCardInterview = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg p-4">
    <div className="h-5 w-24 bg-gray-300 rounded mb-3" />
    <div className="h-5 w-40 bg-gray-300 rounded mb-3" />
    <div className="h-4 w-36 bg-gray-300 rounded mb-2" />
    <div className="h-4 w-28 bg-gray-300 rounded mb-2" />
    <div className="h-4 w-20 bg-gray-300 rounded" />
  </div>
);

/* Course Viewer (Video/Material) Skeleton */
const SkeletonCourseViewer = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg p-3 mb-6">
    <div className="h-7 w-4/5 bg-gray-300 mb-4 rounded" />
    <div className="h-60 w-full bg-gray-300 mb-3 rounded" />
    <div className="h-4 w-3/4 bg-gray-300 mb-2 rounded" />
    <div className="h-4 w-1/2 bg-gray-300 mb-2 rounded" />
    <div className="h-4 w-2/3 bg-gray-300 mb-2 rounded" />
    <div className="h-4 w-full bg-gray-300 rounded" />
  </div>
);

/* Admin Interview Page Skeleton Stat Card */
const SkeletonAdminInterviewStat = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg p-4 h-24 flex flex-col justify-between">
    <div className="h-4 w-16 bg-gray-300 rounded mb-2" />
    <div className="h-6 w-12 bg-gray-300 rounded" />
  </div>
);
/* Admin Interview Page Skeleton Grid Card */
const SkeletonAdminInterviewCard = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="h-4 w-16 bg-gray-300 rounded" />
      <div className="h-8 w-8 bg-gray-300 rounded-full" />
    </div>
    <div className="h-4 w-24 bg-gray-300 rounded mb-1" />
    <div className="h-4 w-32 bg-gray-300 rounded mb-1" />
    <div className="h-4 w-20 bg-gray-300 rounded mb-1" />
    <div className="h-4 w-3/4 bg-gray-300 rounded mb-1" />
    <div className="h-4 w-1/2 bg-gray-300 rounded" />
  </div>
);

const AppSkeleton: React.FC<AppSkeletonProps> = ({
  variant = 'dashboard',
  gridCount = variant === 'interviews' ? 6 : 4,
}) => {
  if (variant === 'course') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center px-3 pt-6">
        <div className="max-w-4xl w-full">
          <SkeletonCourseViewer />
        </div>
        <div className="mt-6 w-full max-w-4xl">
          {[...Array(2)].map((_, idx) => <SkeletonCourseViewer key={idx} />)}
        </div>
      </div>
    );
  }

  if (variant === 'admin-interviews') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-300 h-8 w-8 animate-pulse" />
              <div>
                <div className="h-5 w-52 bg-gray-300 rounded mb-2" />
                <div className="h-3 w-40 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, idx) => <SkeletonAdminInterviewStat key={idx} />)}
          </div>
          {/* Filters & download */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 w-full sm:w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full sm:w-1/4 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => <SkeletonAdminInterviewCard key={idx} />)}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for dashboard, interviews
  const Card = variant === 'interviews' ? SkeletonCardInterview : SkeletonCardDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex gap-3 items-center">
            <div className="rounded-full bg-gray-300 h-8 w-8 animate-pulse" />
            <div>
              <div className={`h-5 ${variant === 'interviews' ? 'w-32' : 'w-40'} bg-gray-300 rounded mb-1 animate-pulse`} />
              <div className={`h-3 ${variant === 'interviews' ? 'w-20' : 'w-28'} bg-gray-300 rounded animate-pulse`} />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {variant === 'dashboard' && <SkeletonCardDashboard />}
        {variant === 'interviews' && (
          <div className="mb-6 flex justify-between items-center">
            <div className="h-7 w-48 bg-gray-300 rounded animate-pulse" />
            <div className="h-9 w-36 bg-gray-300 rounded animate-pulse" />
          </div>
        )}
        <div className={`grid grid-cols-1 ${variant === 'interviews'
          ? 'md:grid-cols-2 lg:grid-cols-3'
          : 'md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
          {[...Array(gridCount)].map((_, idx) => (
            <Card key={idx} />
          ))}
        </div>
        {variant === 'dashboard' && (
          <div className="mt-8 p-4 bg-gray-200 border border-gray-300 rounded-md animate-pulse">
            <div className="h-4 w-28 bg-gray-300 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-300 rounded" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AppSkeleton;
