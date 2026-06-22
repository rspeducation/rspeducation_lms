// src/pages/StudentJoinAdminPage.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { ArrowLeft } from "lucide-react";

// TYPE
type StudentJoin = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  batch: string;
  qualification: string;
  added: boolean;
  joined_at: string;
};

const StudentJoinAdminPage: React.FC = () => {
  const [students, setStudents] = useState<StudentJoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ [id: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_joins")
      .select("id, full_name, email, phone, batch, qualification, added, joined_at")
      .order("joined_at", { ascending: false });

    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setStudents(data || []);
    setLoading(false);
  };

  // Mark as "added"
  const handleToggleAdded = async (id: string, added: boolean) => {
    const { error } = await supabase
      .from("student_joins")
      .update({ added })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setStudents((prev) =>
        prev.map((stu) => (stu.id === id ? { ...stu, added } : stu))
      );
    }
  };

  // Add to students and generate user_id on click
  const handleAddToStudents = async (joinRow: StudentJoin) => {
    try {
      if (joinRow.added) {
        toast({ title: "Already added", description: "Student already present in main table.", variant: "destructive" });
        return;
      }
      // 1. Generate Student Code (using DB function)
      const { data: studentCode, error: codeErr } = await supabase.rpc('gen_student_code');
      if (codeErr || !studentCode) throw new Error(codeErr?.message || "Could not generate student code");

      // 2. Create Supabase Auth User (admin API, requires service role key on backend for production)
      // For front-end/app, use "supabase.auth.admin.createUser"
      const { data: signUpRes, error: signUpErr } = await supabase.auth.admin.createUser({
        email: joinRow.email,
        password: studentCode,
        email_confirm: true
      });
      if (signUpErr || !signUpRes?.user?.id) throw new Error(signUpErr?.message || "Could not create auth user.");
      const user_id = signUpRes.user.id;

      // 3. Insert student row
      const today = new Date().toISOString().slice(0, 10);
      const { error: insertErr } = await supabase.from('students').insert([{
        user_id,
        name: joinRow.full_name,
        email: joinRow.email,
        phone: joinRow.phone,
        batch: joinRow.batch,
        qualification: joinRow.qualification,
        status: 'active',
        created_at: today,
        student_code: studentCode,
      }]);
      if (insertErr) throw insertErr;

      // 4. Mark as added
      await handleToggleAdded(joinRow.id, true);

      toast({
        title: "Success",
        description: `Student added. Student ID: ${studentCode}`,
        variant: "default"
      });
    } catch (err: any) {
      toast({ title: "Add failed", description: err?.message || "Unknown error", variant: "destructive" });
    }
  };

  // Delete a student join row
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const { error } = await supabase
      .from("student_joins")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setStudents((prev) => prev.filter((stu) => stu.id !== id));
      setSelected((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Excel download
  const handleSelectRow = (id: string, isChecked: boolean) => {
    setSelected((prev) => ({
      ...prev,
      [id]: isChecked,
    }));
  };

  const handleDownloadExcel = () => {
    const rows = students.filter((stu) => selected[stu.id]);
    if (rows.length === 0) {
      toast({ title: "No rows selected", description: "Select at least one row.", variant: "destructive" });
      return;
    }
    const dataToExport = rows.map(({ id, ...fields }) => fields);
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_joins.xlsx");
  };

  const filteredStudents = searchTerm
    ? students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.batch.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      {/* Top header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => window.location.href = "/admin/dashboard"}
          className="flex items-center space-x-2 mr-6"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>Dashboard</span>
        </Button>
        <h1 className="text-2xl font-bold">Student Joins</h1>
      </div>
      {/* Search + Download */}
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or batch..."
            className="pl-4 w-full border rounded py-2"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={handleDownloadExcel}
          variant="outline"
          className="ml-4"
        >
          Download Selected as Excel
        </Button>
      </div>
      {/* Student Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelected(
                    checked
                      ? Object.fromEntries(filteredStudents.map((stu) => [stu.id, true]))
                      : {}
                  );
                }}
                checked={
                  filteredStudents.length > 0 &&
                  filteredStudents.every((stu) => selected[stu.id])
                }
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Qualification</TableHead>
            <TableHead>Added?</TableHead>
            <TableHead>Joined At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map((stu) => (
            <TableRow key={stu.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={!!selected[stu.id]}
                  onChange={(e) => handleSelectRow(stu.id, e.target.checked)}
                />
              </TableCell>
              <TableCell>{stu.full_name}</TableCell>
              <TableCell>{stu.email}</TableCell>
              <TableCell>{stu.phone}</TableCell>
              <TableCell>{stu.batch}</TableCell>
              <TableCell>
                <Badge variant="outline">{stu.qualification}</Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={stu.added ? "default" : "outline"}
                  disabled={stu.added}
                >
                  {stu.added ? "Added" : "Not Added"}
                </Button>
              </TableCell>
              <TableCell>
                {new Date(stu.joined_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={stu.added}
                    onClick={() => handleAddToStudents(stu)}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(stu.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {loading && <div className="mt-4 text-blue-600">Loading...</div>}
      {filteredStudents.length === 0 && !loading && (
        <div className="mt-4 text-gray-600">No student join entries found.</div>
      )}
    </div>
  );
};

export default StudentJoinAdminPage;
