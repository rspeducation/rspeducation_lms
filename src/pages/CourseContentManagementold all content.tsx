import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Video, Trash2, Edit, Save, X, Menu, ArrowLeft } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "@/lib/supabase";

// Types
type ContentType = 'drive link' | 'Youtube' ;

type Batch = {
  id: string;
  name: string;
  start_date?: string | null;
  created_at?: string;
};

type CourseFile = { name: string; url: string };

type CourseContentRow = {
  id: string;
  batch_id: string;
  title: string;
  description: string;
  content_type: ContentType;
  file_url?: string | null;  // JSON stringified array
  video_url?: string | null;
  questions?: string | null;
  created_at: string;
  updated_at: string;
};

type CourseContentUI = {
  id: string;
  batch_id: string;
  title: string;
  description: string;
  content_type: ContentType;
  files: CourseFile[];
  videoLink: string;
  questions: string;
  createdAt: string;
  updatedAt: string;
};

// Helpers
const extractDriveFileId = (url: string): string => {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
  return match ? match[1] : "";
};

const rowToUI = (r: CourseContentRow): CourseContentUI => ({
  id: r.id,
  batch_id: r.batch_id,
  title: r.title,
  description: r.description || "",
  content_type: (r.content_type ?? 'video') as ContentType,
  files: r.file_url ? (JSON.parse(r.file_url) as CourseFile[]) : [],
  videoLink: r.video_url ?? "",
  questions: r.questions ?? "",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Component
const CourseContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Page state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const [contents, setContents] = useState<CourseContentUI[]>([]);
  const [selectedContent, setSelectedContent] = useState<CourseContentUI | null>(null);

  const [isAddingContent, setIsAddingContent] = useState(false);
  const [editingContent, setEditingContent] = useState<CourseContentUI | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    videoLink: string;
    questions: string;
    content_type: ContentType;
    files: CourseFile[];
  }>({
    title: "",
    description: "",
    videoLink: "",
    questions: "",
    content_type: "video",
    files: [],
  });

  // Auth guard + initial load
  useEffect(() => {
    const isAdminAuth = localStorage.getItem("adminAuth");
    if (!isAdminAuth || isAdminAuth !== "true") {
      navigate("/admin/login");
      return;
    }
    loadBatches();
  }, [navigate]);

  const loadBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("id,name,start_date,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load batches", variant: "destructive" });
      return;
    }
    setBatches(data ?? []);
  }, [toast]);

  const loadContent = useCallback(async (batchId: string) => {
    const { data, error } = await supabase
      .from("coursecontent")
      .select("*")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load course content", variant: "destructive" });
      return;
    }
    const list = (data ?? []).map(rowToUI);
    setContents(list);
    setSelectedContent(list[0] ?? null);
  }, [toast]);

  // Realtime refresh on this batch’s content
  useEffect(() => {
    if (!selectedBatch) return;
    const ch = supabase
      .channel(`coursecontent_batch_${selectedBatch.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coursecontent', filter: `batch_id=eq.${selectedBatch.id}` },
        () => loadContent(selectedBatch.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedBatch, loadContent]);

  // UI helpers
  const handleInputChange = (field: keyof typeof formData, value: string | CourseFile[]) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mapped = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...mapped] }));
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: "Error", description: "Description is required", variant: "destructive" });
      return false;
    }
    if (!selectedBatch) {
      toast({ title: "Error", description: "Please select a batch", variant: "destructive" });
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoLink: "",
      questions: "",
      content_type: "video",
      files: [],
    });
    setIsAddingContent(false);
    setEditingContent(null);
  };

  const startAdd = () => {
    setEditingContent(null);
    setIsAddingContent(true);
  };

  const startEdit = (c: CourseContentUI) => {
    setEditingContent(c);
    setFormData({
      title: c.title,
      description: c.description,
      videoLink: c.videoLink,
      questions: c.questions,
      content_type: c.content_type,
      files: c.files,
    });
    setIsAddingContent(true);
  };

  const saveContent = async () => {
    if (!validateForm() || !selectedBatch) return;

    const payload = {
      batch_id: selectedBatch.id,
      title: formData.title,
      description: formData.description,
      content_type: formData.content_type,
      video_url: formData.videoLink || null,
      questions: formData.questions || null,
      file_url: formData.files.length > 0 ? JSON.stringify(formData.files) : null,
    };

    if (editingContent) {
      const { error } = await supabase.from("coursecontent")
        .update(payload)
        .eq("id", editingContent.id)
        .eq("batch_id", selectedBatch.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update content", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Content updated successfully" });
    } else {
      const { error } = await supabase.from("coursecontent").insert([payload]);
      if (error) {
        toast({ title: "Error", description: "Failed to create content", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Content added successfully" });
    }

    resetForm();
    await loadContent(selectedBatch.id);
  };

  const deleteContent = async (id: string) => {
    if (!selectedBatch) return;
    const { error } = await supabase
      .from("coursecontent")
      .delete()
      .eq("id", id)
      .eq("batch_id", selectedBatch.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete content", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Content deleted successfully" });
    await loadContent(selectedBatch.id);
    setSelectedContent(null);
  };

  // Views
  const BatchGrid = useMemo(() => (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Batch Content</h2>
          <p className="text-gray-600">Batch-wise course materials management</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            No batches found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map(b => (
            <Card key={b.id} className="hover:shadow-md transition cursor-pointer"
              onClick={async () => { setSelectedBatch(b); await loadContent(b.id); }}>
              <CardHeader>
                <CardTitle className="text-lg">{b.name}</CardTitle>
                <CardDescription>
                  {b.start_date ? `Starts on ${new Date(b.start_date).toLocaleDateString('en-GB')}` : 'Start date not set'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Click to manage content
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  ), [batches, loadContent]);

  const ContentView = useMemo(() => {
    if (!selectedBatch) return null;
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`fixed md:static top-0 left-0 h-full w-64 bg-white border-r shadow-lg z-30 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="font-bold text-lg">Contents</h2>
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-3rem)] p-2 space-y-2">
            {contents.map((content) => (
              <Card
                key={content.id}
                onClick={() => { setSelectedContent(content); setSidebarOpen(false); }}
                className={`cursor-pointer ${selectedContent?.id === content.id ? "border-green-500" : "hover:border-gray-400"}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    {content.videoLink && <Video className="h-4 w-4 text-blue-600" />}
                    <span>{content.title}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => { setSelectedBatch(null); setContents([]); setSelectedContent(null); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Batches
              </Button>
            </div>
            <div className="flex-1" />
            <div className="flex space-x-2">
              <Button size="sm" onClick={startAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add New
              </Button>
              {selectedContent && (
                <>
                  <Button size="sm" variant="outline" onClick={() => startEdit(selectedContent)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteContent(selectedContent.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Add/Edit Form */}
            {isAddingContent && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editingContent ? "Edit Content" : "Add New Content"} — {selectedBatch.name}</CardTitle>
                  <CardDescription>Fill out details for your course content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={formData.content_type}
                        onChange={(e) => handleInputChange("content_type", e.target.value as ContentType)}
                      >
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="assignment">Assignment</option>
                      </select>
                    </div>
                    <div>
                      <Label>Video Link (Google Drive)</Label>
                      <Input value={formData.videoLink} onChange={(e) => handleInputChange("videoLink", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={(v) => setFormData((prev) => ({ ...prev, description: v }))}
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, false] }],
                          ["bold", "italic", "underline", "strike"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link", "image", "code-block"],
                          ["clean"],
                        ],
                      }}
                    />
                  </div>

                  <div>
                    <Label>Questions</Label>
                    <Textarea value={formData.questions} onChange={(e) => handleInputChange("questions", e.target.value)} />
                  </div>

                  <div>
                    <Label>Upload Files</Label>
                    <Input type="file" multiple onChange={handleFileUpload} />
                    {formData.files.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm">
                        {formData.files.map((file, index) => (
                          <li key={index} className="flex justify-between items-center bg-gray-100 p-1 rounded">
                            {file.name}
                            <button onClick={() => removeFile(index)}><X className="h-4 w-4" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={saveContent}><Save className="h-4 w-4 mr-1" />{editingContent ? "Update" : "Save"}</Button>
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detail View */}
            {selectedContent && !isAddingContent && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedContent.title}</CardTitle>
                  <CardDescription>Created {new Date(selectedContent.createdAt).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedContent.videoLink && (
                    <div className="flex justify-left">
                      <iframe
                        src={`https://drive.google.com/file/d/${extractDriveFileId(selectedContent.videoLink)}/preview`}
                        className="w-full md:w-2/3 lg:w-2/3 aspect-video mb-4"
                        allow="autoplay"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedContent.description }} />

                  {selectedContent.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Files</h4>
                      <ul className="list-disc pl-5">
                        {selectedContent.files.map((file, i) => (
                          <li key={i}>
                            <a href={file.url} download={file.name} className="text-blue-600 underline">{file.name}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedContent.questions && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Questions</h4>
                      <p className="whitespace-pre-wrap">{selectedContent.questions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedBatch, contents, selectedContent, sidebarOpen, editingContent, formData]);

  // Render batches grid first; after picking a batch, render content UI
  if (!selectedBatch) return BatchGrid;
  return ContentView;
};

export default CourseContentManagement;






// src/pages/CourseContentManagement.tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Video, Trash2, Edit, Save, X, Menu, ArrowLeft } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "@/lib/supabase";

// Types
type Batch = {
  id: string;
  name: string;
  start_date?: string | null;
  created_at?: string;
};

type CourseFile = { name: string; url: string };

type CourseContentRow = {
  id: string;
  batch_id: string;
  title: string;
  description: string | null;
  content_type: string | null;   // stored for compatibility but inferred automatically
  file_url?: string | null;      // JSON stringified array
  video_url?: string | null;
  questions?: string | null;
  created_at: string;
  updated_at: string;
};

type CourseContentUI = {
  id: string;
  batch_id: string;
  title: string;
  description: string;
  files: CourseFile[];
  videoLink: string;
  questions: string;
  createdAt: string;
  updatedAt: string;
};

// Helpers: infer embed and type from URL (no manual dropdown)
const inferYoutubeId = (url: string) => {
  if (!url) return "";
  const watch = url.match(/[?&]v=([A-Za-z0-9_\-]+)/)?.[1];
  const short = url.match(/youtu\.be\/([A-Za-z0-9_\-]+)/)?.[1];
  return watch || short || "";
};

const inferDriveId = (url: string) => {
  if (!url) return "";
  return url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_\-]+)/)?.[1] || "";
};

const getEmbedSrc = (url: string) => {
  const yid = inferYoutubeId(url);
  if (yid) return `https://www.youtube.com/embed/${yid}`;
  const did = inferDriveId(url);
  if (did) return `https://drive.google.com/file/d/${did}/preview`;
  return ""; // unknown link -> no iframe
};

const rowToUI = (r: CourseContentRow): CourseContentUI => ({
  id: r.id,
  batch_id: r.batch_id,
  title: r.title,
  description: r.description || "",
  files: r.file_url ? (JSON.parse(r.file_url) as CourseFile[]) : [],
  videoLink: r.video_url ?? "",
  questions: r.questions ?? "",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const CourseContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Page state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const [contents, setContents] = useState<CourseContentUI[]>([]);
  const [selectedContent, setSelectedContent] = useState<CourseContentUI | null>(null);

  const [isAddingContent, setIsAddingContent] = useState(false);
  const [editingContent, setEditingContent] = useState<CourseContentUI | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    videoLink: string;
    questions: string;
    files: CourseFile[];
  }>({
    title: "",
    description: "",
    videoLink: "",
    questions: "",
    files: [],
  });

  // Auth guard + initial load
  useEffect(() => {
    const isAdminAuth = localStorage.getItem("adminAuth");
    if (!isAdminAuth || isAdminAuth !== "true") {
      navigate("/admin/login");
      return;
    }
    loadBatches();
  }, [navigate]);

  const loadBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("id,name,start_date,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load batches", variant: "destructive" });
      return;
    }
    setBatches(data ?? []);
  }, [toast]);

  const loadContent = useCallback(async (batchId: string) => {
    const { data, error } = await supabase
      .from("coursecontent")
      .select("*")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load course content", variant: "destructive" });
      return;
    }
    const list = (data ?? []).map(rowToUI);
    setContents(list);
    setSelectedContent(list[0] ?? null);
  }, [toast]);

  // Realtime refresh on this batch’s content
  useEffect(() => {
    if (!selectedBatch) return;
    const ch = supabase
      .channel(`coursecontent_batch_${selectedBatch.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coursecontent', filter: `batch_id=eq.${selectedBatch.id}` },
        () => loadContent(selectedBatch.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedBatch, loadContent]);

  // UI helpers
  const handleInputChange = (field: keyof typeof formData, value: string | CourseFile[]) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mapped = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...mapped] }));
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: "Error", description: "Description is required", variant: "destructive" });
      return false;
    }
    if (!selectedBatch) {
      toast({ title: "Error", description: "Please select a batch", variant: "destructive" });
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoLink: "",
      questions: "",
      files: [],
    });
    setIsAddingContent(false);
    setEditingContent(null);
  };

  const startAdd = () => {
    setSelectedContent(null);       // show only editor
    setEditingContent(null);
    setIsAddingContent(true);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const startEdit = (c: CourseContentUI) => {
    setEditingContent(c);
    setFormData({
      title: c.title,
      description: c.description,
      videoLink: c.videoLink,
      questions: c.questions,
      files: c.files,
    });
    setIsAddingContent(true);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const inferContentType = (url: string): string | null => {
    if (inferYoutubeId(url)) return 'Youtube';
    if (inferDriveId(url)) return 'drive link';
    return null; // unknown; still saved and shown as plain link below (no iframe)
  };

  const saveContent = async () => {
    if (!validateForm() || !selectedBatch) return;

    const payload = {
      batch_id: selectedBatch.id,
      title: formData.title.trim(),
      description: formData.description,
      content_type: inferContentType(formData.videoLink || ""), // inferred
      video_url: formData.videoLink || null,
      questions: formData.questions || null,
      file_url: formData.files.length
        ? JSON.stringify(formData.files.filter(f => f.name.trim() && f.url.trim()))
        : null,
    };

    if (editingContent) {
      const { data, error } = await supabase.from("coursecontent")
        .update(payload)
        .eq("id", editingContent.id)
        .eq("batch_id", selectedBatch.id)
        .select("*")
        .single();

      if (error) {
        toast({ title: "Error", description: "Failed to update content", variant: "destructive" });
        return;
      }
      const updated = rowToUI(data as CourseContentRow);
      await loadContent(selectedBatch.id);
      setSelectedContent(updated);
      setIsAddingContent(false);
      toast({ title: "Success", description: "Content updated successfully" });
    } else {
      const { data, error } = await supabase.from("coursecontent")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        toast({ title: "Error", description: "Failed to create content", variant: "destructive" });
        return;
      }
      const inserted = rowToUI(data as CourseContentRow);
      await loadContent(selectedBatch.id);
      setSelectedContent(inserted);  // immediately preview the new item
      setIsAddingContent(false);
      toast({ title: "Success", description: "Content added successfully" });
    }

    // finally clear editor
    setFormData({
      title: "",
      description: "",
      videoLink: "",
      questions: "",
      files: [],
    });
    setEditingContent(null);
  };

  const deleteContent = async (id: string) => {
    if (!selectedBatch) return;
    const { error } = await supabase
      .from("coursecontent")
      .delete()
      .eq("id", id)
      .eq("batch_id", selectedBatch.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete content", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Content deleted successfully" });
    await loadContent(selectedBatch.id);
    setSelectedContent(null);
  };

  // Views
  const BatchGrid = useMemo(() => (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Batch Content</h2>
          <p className="text-gray-600">Batch-wise course materials management</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            No batches found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map(b => (
            <Card key={b.id} className="hover:shadow-md transition cursor-pointer"
              onClick={async () => { setSelectedBatch(b); await loadContent(b.id); }}>
              <CardHeader>
                <CardTitle className="text-lg">{b.name}</CardTitle>
                <CardDescription>
                  {b.start_date ? `Starts on ${new Date(b.start_date).toLocaleDateString('en-GB')}` : 'Start date not set'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Click to manage content
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  ), [batches, loadContent]);

  const ContentView = useMemo(() => {
    if (!selectedBatch) return null;

    const previewSrc = selectedContent?.videoLink ? getEmbedSrc(selectedContent.videoLink) : '';

    return (
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`fixed md:static top-0 left-0 h-full w-64 bg-white border-r shadow-lg z-30 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="font-bold text-lg">Contents</h2>
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-3rem)] p-2 space-y-2">
            {contents.map((content) => (
              <Card
                key={content.id}
                onClick={() => { setSelectedContent(content); setSidebarOpen(false); setIsAddingContent(false); }}
                className={`cursor-pointer ${selectedContent?.id === content.id ? "border-green-500" : "hover:border-gray-400"}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    {content.videoLink && <Video className="h-4 w-4 text-blue-600" />}
                    <span>{content.title}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => { setSelectedBatch(null); setContents([]); setSelectedContent(null); setIsAddingContent(false); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Batches
              </Button>
            </div>
            <div className="flex-1" />
            <div className="flex space-x-2">
              <Button size="sm" onClick={startAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add New
              </Button>
              {selectedContent && (
                <>
                  <Button size="sm" variant="outline" onClick={() => startEdit(selectedContent)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteContent(selectedContent.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Add/Edit Form */}
            {isAddingContent && (
              <div ref={editorRef}>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{editingContent ? "Edit Content" : "Add New Content"} — {selectedBatch.name}</CardTitle>
                    <CardDescription>Fill out details for your course content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Main Link (Drive or YouTube)</Label>
                        <Input value={formData.videoLink} onChange={(e) => handleInputChange("videoLink", e.target.value)} placeholder="https://www.youtube.com/... or https://drive.google.com/file/d/..." />
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={(v) => setFormData((prev) => ({ ...prev, description: v }))}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ["bold", "italic", "underline", "strike"],
                            [{ list: "ordered" }, { list: "bullet" }],
                            ["link", "image", "code-block"],
                            ["clean"],
                          ],
                        }}
                      />
                    </div>

                    <div>
                      <Label>Questions</Label>
                      <Textarea value={formData.questions} onChange={(e) => handleInputChange("questions", e.target.value)} />
                    </div>

                    <div>
                      <Label>Files (name and URL)</Label>
                      <div className="space-y-2">
                        {formData.files.map((f, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <Input
                              className="md:col-span-2"
                              placeholder="File name"
                              value={f.name}
                              onChange={(e) =>
                                setFormData(prev => ({
                                  ...prev,
                                  files: prev.files.map((x, i) => i === idx ? { ...x, name: e.target.value } : x)
                                }))
                              }
                            />
                            <Input
                              className="md:col-span-3"
                              placeholder="https://file-url"
                              value={f.url}
                              onChange={(e) =>
                                setFormData(prev => ({
                                  ...prev,
                                  files: prev.files.map((x, i) => i === idx ? { ...x, url: e.target.value } : x)
                                }))
                              }
                            />
                            <Button type="button" variant="outline" onClick={() =>
                              setFormData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))
                            }>Remove</Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() =>
                          setFormData(prev => ({ ...prev, files: [...prev.files, { name: "", url: "" }] }))
                        }>Add File</Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: paste Google Drive or YouTube links; preview is automatic if recognized.
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={saveContent}><Save className="h-4 w-4 mr-1" />{editingContent ? "Update" : "Save"}</Button>
                      <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detail View */}
            {selectedContent && !isAddingContent && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedContent.title}</CardTitle>
                  <CardDescription>Created {new Date(selectedContent.createdAt).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedContent.videoLink && getEmbedSrc(selectedContent.videoLink) && (
                    <div className="flex justify-left">
                      <iframe
                        src={getEmbedSrc(selectedContent.videoLink)}
                        className="w-full md:w-2/3 lg:w-2/3 aspect-video mb-4"
                        allow="autoplay"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedContent.description }} />

                  {selectedContent.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Files</h4>
                      <ul className="list-disc pl-5">
                        {selectedContent.files.map((file, i) => (
                          <li key={i}>
                            <a href={file.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                              {file.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedContent.questions && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Questions</h4>
                      <p className="whitespace-pre-wrap">{selectedContent.questions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedBatch, contents, selectedContent, sidebarOpen, editingContent, formData]);

  // Render batches grid first; after picking a batch, render content UI
  if (!selectedBatch) return BatchGrid;
  return ContentView;
};

export default CourseContentManagement;

