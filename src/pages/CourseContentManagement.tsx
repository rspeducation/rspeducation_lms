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
import { supabase } from "@/lib/supabase";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type Batch = {
  id: string;
  name: string;
  start_date?: string | null;
  created_at?: string;
};

type CourseFile = { name: string; url: string };

type ContentRow = {
  id: string;
  batch_id: string;
  title: string;
  video_url: string;
  description: string | null;
  questions: string | null;
  file_url: string | null; // JSON array [{name,url}]
  created_at: string;
  updated_at: string;
};

type ContentUI = {
  id: string;
  batch_id: string;
  title: string;
  video_url: string;
  description: string;
  questions: string;
  files: CourseFile[];
  created_at: string;
  updated_at: string;
};

function toUI(r: ContentRow): ContentUI {
  return {
    id: r.id,
    batch_id: r.batch_id,
    title: r.title,
    video_url: r.video_url,
    description: r.description ?? "",
    questions: r.questions ?? "",
    files: r.file_url ? (JSON.parse(r.file_url) as CourseFile[]) : [],
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// Accept only YouTube or Google Drive links; build an iframe-friendly embed URL
function makeEmbedUrl(url: string): string {
  const clean = url.trim();

  // YouTube watch?v=
  const ytWatch = clean.match(/youtube\.com\/watch\?v=([A-Za-z0-9_\-]+)/);
  if (ytWatch?.[1]) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  // youtu.be short
  const ytShort = clean.match(/youtu\.be\/([A-Za-z0-9_\-]+)/);
  if (ytShort?.[1]) return `https://www.youtube.com/embed/${ytShort[1]}`;

  // Google Drive /file/d/<id>/
  const drv = clean.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_\-]+)\//);
  if (drv?.[1]) return `https://drive.google.com/file/d/${drv[1]}/preview`;

  return ""; // invalid
}

const CourseContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Batches and selection
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Content for selected batch
  const [items, setItems] = useState<ContentUI[]>([]);
  const [selected, setSelected] = useState<ContentUI | null>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<ContentUI | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState("");
  const [files, setFiles] = useState<CourseFile[]>([]);

  // Guard + load batches
  useEffect(() => {
    const isAdminAuth = localStorage.getItem("adminAuth") === "true";
    if (!isAdminAuth) {
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
      toast({ title: "Error", description: "Failed to load content", variant: "destructive" });
      return;
    }
    const list = (data ?? []).map(toUI);
    setItems(list);
    setSelected(list[0] ?? null);
  }, [toast]);

  // Realtime refresh for this batch
  useEffect(() => {
    if (!selectedBatch) return;
    const ch = supabase
      .channel(`coursecontent_batch_${selectedBatch.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'coursecontent', filter: `batch_id=eq.${selectedBatch.id}` },
        () => loadContent(selectedBatch.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedBatch, loadContent]);

  const startAdd = () => {
    setEditing(null);
    setTitle("");
    setVideoUrl("");
    setDescription("");
    setQuestions("");
    setFiles([]);
    setIsAdding(true);
  };

  const startEdit = (c: ContentUI) => {
    setEditing(c);
    setTitle(c.title);
    setVideoUrl(c.video_url);
    setDescription(c.description);
    setQuestions(c.questions);
    setFiles(c.files);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditing(null);
    setTitle("");
    setVideoUrl("");
    setDescription("");
    setQuestions("");
    setFiles([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const flist = Array.from(event.target.files || []);
    const mapped: CourseFile[] = flist.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): string | null => {
    if (!selectedBatch) return "Select a batch first.";
    if (!title.trim()) return "Title is required.";
    if (!makeEmbedUrl(videoUrl)) return "Enter a valid YouTube or Google Drive link.";
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Error", description: err, variant: "destructive" });
      return;
    }
    if (!selectedBatch) return;

    const payload = {
      batch_id: selectedBatch.id,
      title: title.trim(),
      video_url: videoUrl.trim(),
      description: description || null,
      questions: questions || null,
      file_url: files.length > 0 ? JSON.stringify(files) : null,
    };

    if (editing) {
      const { error } = await supabase
        .from("coursecontent")
        .update(payload)
        .eq("id", editing.id)
        .eq("batch_id", selectedBatch.id);
      if (error) {
        toast({ title: "Error", description: "Failed to update content", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Content updated successfully" });
    } else {
      const { error } = await supabase
        .from("coursecontent")
        .insert([payload]);
      if (error) {
        toast({ title: "Error", description: "Failed to add content", variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Video content saved" });
    }

    resetForm();
    await loadContent(selectedBatch.id);
  };

  const remove = async (id: string) => {
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
    toast({ title: "Deleted", description: "Content removed" });
    await loadContent(selectedBatch.id);
    setSelected(null);
  };

  const BatchGrid = useMemo(() => (
    <div className="max-w-7xl mx-auto p-6">
      {/* <div className="flex items-left  mb-6"> */}
              <div className="bg-white shadow-sm border-b mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span> Back</span>
              </Button>
              {/* <Calendar className="h-8 w-8 text-blue-600" /> */}
              <div>
                
                <h1 className="text-xl font-bold text-gray-900">Batch Management</h1>
                <p className="text-sm text-gray-600">Manage student batches wise</p>
              </div>
            </div>
          </div>
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
    const embed = makeEmbedUrl(videoUrl);

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
            {items.map((c) => (
              <Card
                key={c.id}
                onClick={() => { setSelected(c); setSidebarOpen(false); }}
                className={`cursor-pointer ${selected?.id === c.id ? "border-green-500" : "hover:border-gray-400"}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Video className="h-4 w-4 text-blue-600" />
                    <span>{c.title}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
            <div className=" flex items-center gap-2">
              <Button variant="ghost" onClick={() => { setSelectedBatch(null); setItems([]); setSelected(null); }}>
                <ArrowLeft className=" h-4 w-4 mr-1" /><span className="hidden sm:flex">Back</span></Button>
            </div>
            <div className="flex-1" />
            <div className="flex space-x-2">
              <Button size="sm" onClick={startAdd}><Plus className="h-4 w-4 mr-1" /> Add New</Button>
              {selected && (
                <>
                  <Button size="sm" variant="outline" onClick={() => startEdit(selected)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(selected.id)}><Trash2 className="h-4 w-4 mr-1" /><span className="hidden sm:flex">Delete</span></Button>
                </>
              )}
              <Button variant="outline" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Add/Edit Form */}
            {isAdding && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editing ? "Edit Content" : "Add New Content"} — {selectedBatch.name}</CardTitle>
                  <CardDescription>Video, description (optional), questions (optional), and attached file links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div>
                    <Label>Video Link</Label>
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtu.be/... or https://drive.google.com/file/d/.../view"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <ReactQuill
                      theme="snow"
                      value={description}
                      onChange={setDescription}
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, false] }],
                          ["bold", "italic", "underline", "strike"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link", "code-block"],
                          ["clean"],
                        ],
                      }}
                    />
                  </div>

                  <div>
                    <Label>Questions</Label>
                    <Textarea
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      placeholder="Optional: paste practice questions or notes"
                    />
                  </div>

                  <div>
                    <Label>Upload Files</Label>
                    <Input type="file" multiple onChange={handleFileUpload} />
                    {files.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm">
                        {files.map((file, index) => (
                          <li key={index} className="flex justify-between items-center bg-gray-100 p-1 rounded">
                            {file.name}
                            <button type="button" onClick={() => removeFile(index)}>
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Note: files are referenced via local object URLs in this demo; wire to real storage (Supabase Storage) for production.
                    </p>
                  </div>

                  {/* Live embed preview if valid */}
                  {videoUrl.trim() && makeEmbedUrl(videoUrl) && (
                    <div className="mt-2">
                      <Label>Preview</Label>
                      <div className="mt-2 aspect-video w-full md:w-2/3">
                        <iframe
                          src={makeEmbedUrl(videoUrl)!}
                          className="w-full h-full rounded border"
                          allow="autoplay"
                          allowFullScreen
                          title="Video Preview"
                        />
                      </div>
                    </div>
                  )}
                  {videoUrl.trim() && !makeEmbedUrl(videoUrl) && (
                    <p className="text-sm text-red-600">
                      Enter a valid YouTube watch/youtu.be link or a Google Drive /file/d/... link.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={save}><Save className="h-4 w-4 mr-1" />{editing ? "Update" : "Save"}</Button>
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detail view */}
            {selected && !isAdding && (
              <Card>
                <CardHeader>
                  <CardTitle>{selected.title}</CardTitle>
                  <CardDescription>Created {new Date(selected.created_at).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video w-full md:w-2/3">
                    <iframe
                      src={makeEmbedUrl(selected.video_url) || ""}
                      className="w-full h-full rounded border"
                      allow="autoplay"
                      allowFullScreen
                      title="Selected Video"
                    />
                  </div>

                  {selected.description && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Description</h4>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selected.description }} />
                    </div>
                  )}

                  {selected.questions && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Questions</h4>
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{selected.questions}</p>
                    </div>
                  )}

                  {selected.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Files</h4>
                      <ul className="list-disc pl-5">
                        {selected.files.map((f, i) => (
                          <li key={i}>
                            <a href={f.url} download={f.name} className="text-blue-600 underline">
                              {f.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedBatch, items, selected, sidebarOpen, isAdding, editing, title, videoUrl, description, questions, files]);

  if (!selectedBatch) return BatchGrid;
  return ContentView;
};

export default CourseContentManagement;
