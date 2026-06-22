// src/pages/CourseViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, FileText, ExternalLink, Menu, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

import AppSkeleton from '@/components/AppSkeleton';

// DB row shape
type DbCourseContent = {
  id: string;
  batch_id: string;
  title: string | null;
  description: string | null;
  questions: string | null;
  video_url: string | null;
  file_url: string | null;   // JSON string: [{name,url}]
  created_at: string | null;
};

// UI shape
type CourseContent = {
  id: string;
  title: string;
  description: string;
  videoLink: string;
  questions: string;
  files: { name: string; url?: string }[];
  createdAt: string;
};

// Helpers: infer and build embed URL (Drive or YouTube)
const inferYoutubeId = (url: string) => {
  if (!url) return '';
  const w = url.match(/[?&]v=([A-Za-z0-9_\-]+)/)?.[1];
  const s = url.match(/youtu\.be\/([A-Za-z0-9_\-]+)/)?.[1];
  return w || s || '';
};

const inferDriveId = (url: string) => {
  if (!url) return '';
  return url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_\-]+)/)?.[1] || '';
};

const embedUrl = (url: string) => {
  const yid = inferYoutubeId(url);
  if (yid) return `https://www.youtube.com/embed/${yid}`;
  const did = inferDriveId(url);
  if (did) return `https://drive.google.com/file/d/${did}/preview`;
  return ''; // unknown link => no iframe
};

const parseFiles = (file_url: string | null): { name: string; url?: string }[] => {
  if (!file_url) return [];
  try {
    const arr = JSON.parse(file_url);
    if (Array.isArray(arr)) {
      return arr.map((f: any) => ({ name: f?.name ?? 'resource', url: f?.url }));
    }
  } catch {}
  return [];
};

const CourseViewer: React.FC = () => {
  const { batchId } = useParams<{ batchId?: string }>();
  const navigate = useNavigate();
  const [courseContent, setCourseContent] = useState<CourseContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sidebar width for resizing (adjustable)
  const [sidebarW, setSidebarW] = useState<number>(280); // initial px width
  const isResizing = useRef(false);

  const onDown = () => { isResizing.current = true; };
  const onUp = () => { isResizing.current = false; };
  const onMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    setSidebarW(w => Math.max(200, Math.min(480, w + e.movementX))); // clamp
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Load content by route batchId; fallback to student's batch
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);

      // Get session
      const { data: sessionRes } = await supabase.auth.getSession();
      const authUserId = sessionRes.session?.user?.id;
      if (!authUserId) {
        navigate('/login');
        return;
      }

      // Resolve target batch_id: prefer URL param, else student's batch
      let targetBatchId = batchId || '';
      if (!targetBatchId) {
        const { data: student } = await supabase
          .from('students')
          .select('batch_id')
          .eq('user_id', authUserId)
          .single();
        targetBatchId = student?.batch_id || '';
      }

      if (!targetBatchId) {
        if (!ignore) {
          setCourseContent([]);
          setLoading(false);
        }
        return;
      }

      // Fetch content for resolved batch
      const { data: rows, error } = await supabase
        .from('coursecontent')
        .select('id,batch_id,title,video_url,description,questions,file_url,created_at')
        .eq('batch_id', targetBatchId)
        .order('created_at', { ascending: true });

      if (!ignore) {
        if (error || !rows) {
          setCourseContent([]);
        } else {
          const mapped: CourseContent[] = (rows as DbCourseContent[]).map((r) => ({
            id: r.id,
            title: r.title ?? 'Untitled',
            description: r.description ?? '',
            videoLink: r.video_url ?? '',
            questions: r.questions ?? '',
            files: parseFiles(r.file_url),
            createdAt: r.created_at ?? new Date().toISOString(),
          }));
          setCourseContent(mapped);
        }
        setCurrentIndex(0);
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [batchId, navigate]);

  const currentContent = courseContent[currentIndex];
  const handlePrevious = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex((i) => Math.min(courseContent.length - 1, i + 1));
  const handleContentSelect = (index: number) => { setCurrentIndex(index); setSidebarOpen(false); };

  // if (loading) {
  //   return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  // }

  if (loading) {
    // Show course skeleton loader while fetching
    return <AppSkeleton variant="course" />;
  }

  if (!currentContent) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No course materials available</h3>
            <p className="mt-1 text-sm text-gray-500">Course materials will appear here once your instructor adds them.</p>
          </div>
        </div>
      </div>
    );
  }

  const videoSrc = currentContent.videoLink ? embedUrl(currentContent.videoLink) : '';

  return (
    <div className="min-h-screen">
      {/* Mobile Toggle Button */}
      <div className="md:hidden p-4 bg-white border-b flex justify-between items-center relative z-30">
        <h2 className="font-bold text-lg">Course Viewer</h2>
        <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Fixed Sidebar (desktop) */}
      <aside
        className="hidden md:block fixed top-0 left-0 h-full bg-white border-r shadow-sm overflow-y-auto z-20"
        style={{ width: sidebarW }}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
          <p className="text-sm text-gray-600">{courseContent.length} lessons available</p>
        </div>

        <div className="p-2">
          {courseContent.map((content, index) => (
            <div
              key={content.id}
              onClick={() => handleContentSelect(index)}
              className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                index === currentIndex
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium truncate ${index === currentIndex ? 'text-blue-900' : 'text-gray-900'}`}>
                    {content.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Added {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                  {!!content.videoLink && (
                    <div className="flex items-center mt-1">
                      <Play className="h-3 w-3 text-blue-600 mr-1" />
                      <span className="text-xs text-blue-600">Video</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Resize handle (desktop) */}
      <div
        className="hidden md:block fixed top-0 h-full w-1 cursor-col-resize bg-blue-200 hover:bg-blue-300 active:bg-blue-400 z-30"
        style={{ left: sidebarW }}
        onMouseDown={onDown}
        role="separator"
        aria-label="Resize sidebar"
      />

      {/* Mobile sidebar as overlay drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-90 bg-white border-r overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
              <p className="text-sm text-gray-600">{courseContent.length} lessons available</p>
            </div>
            <div className="p-2">
              {courseContent.map((content, index) => (
                <div
                  key={content.id}
                  onClick={() => handleContentSelect(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    index === currentIndex
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium truncate ${index === currentIndex ? 'text-blue-900' : 'text-gray-900'}`}>
                        {content.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Added {new Date(content.createdAt).toLocaleDateString()}
                      </p>
                      {!!content.videoLink && (
                        <div className="flex items-center mt-1">
                          <Play className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="text-xs text-blue-600">Video</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content with left margin to account for fixed sidebar */}
      <main
        className="hidden md:block bg-gray-50 overflow-y-auto p-4 sm:p-6 min-h-screen"
        style={{ marginLeft: sidebarW + 4 }} // +4 for resize handle
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentContent.title}</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
           <span className='hidden ms:flex'>Go to</span>Dashboard
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">Lesson {currentIndex + 1} of {courseContent.length}</p>

        {/* Video */}
        {!!videoSrc && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-blue-600" />
                <span>Video Lesson</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <iframe
                  src={videoSrc}
                  title={currentContent.title}
                  allow="autoplay"
                  allowFullScreen
                  className="w-full aspect-video mb-4"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {!!currentContent.questions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Practice Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-1 m-0">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{currentContent.questions}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentContent.description }} />
          </CardContent>
        </Card>

        {/* Files */}
        {currentContent.files.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentContent.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-3 rounded-lg gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                    {'url' in file && file.url ? (
                      <a className="text-blue-600 underline text-sm" href={file.url} target="_blank" rel="noreferrer">Open</a>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm gap-2">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="flex items-center space-x-2 w-full sm:w-auto">
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <Button onClick={() => window.open('https://interview-rsp-ai.netlify.app', '_blank')} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <ExternalLink className="h-4 w-4" />
            <span>Mock Test</span>
          </Button>

          <Button variant="outline" onClick={handleNext} disabled={currentIndex === courseContent.length - 1} className="flex items-center space-x-2 w-full sm:w-auto">
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>

      {/* Mobile main content */}
      <main className="md:hidden bg-gray-50 overflow-y-auto p-4 sm:p-6 min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentContent.title}</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Dashboard
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">Lesson {currentIndex + 1} of {courseContent.length}</p>

        {/* Video */}
        {!!videoSrc && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-blue-600" />
                <span>Video Lesson</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <iframe
                  src={videoSrc}
                  title={currentContent.title}
                  allow="autoplay"
                  allowFullScreen
                  className="w-full aspect-video mb-4"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {!!currentContent.questions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Practice Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-1">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{currentContent.questions}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentContent.description }} />
          </CardContent>
        </Card>

        {/* Files */}
        {currentContent.files.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentContent.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-3 rounded-lg gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                    {'url' in file && file.url ? (
                      <a className="text-blue-600 underline text-sm" href={file.url} target="_blank" rel="noreferrer">Open</a>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm gap-2">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="flex items-center space-x-2 w-full sm:w-auto">
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <Button onClick={() => window.open('https://azure.rspeducation.in/MockTest/', '_blank')} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <ExternalLink className="h-4 w-4" />
            <span>Mock Test</span>
          </Button>

          <Button variant="outline" onClick={handleNext} disabled={currentIndex === courseContent.length - 1} className="flex items-center space-x-2 w-full sm:w-auto">
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CourseViewer;
