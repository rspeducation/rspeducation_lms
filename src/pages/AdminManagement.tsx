import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function generateAdminId(length = 8) {
  const chars = 'AZURERAJURSP';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const AdminManagement: React.FC = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [formData, setFormData] = useState({ display_name: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  

  const fetchAdmins = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });
    setIsLoading(false);

    if (error) toast({ title: 'Error', description: error.message, variant: "destructive" });
    else setAdmins(data || []);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const admin_id = generateAdminId();
    const { data, error } = await supabase
      .from('admins')
      .insert({
        display_name: formData.display_name.trim(),
        email: formData.email.trim(),
        admin_id,
        enabled: true,
      })
      .select('*')
      .single();

    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: "destructive" });
    } else if (data) {
      toast({
        title: "Admin Added",
        description: `Saved: ${data.display_name}, Admin ID: ${data.admin_id}`,
      });
      setFormData({ display_name: '', email: '' });
      fetchAdmins();
    }
  };

  const handleDeleteAdmin = async (admin_id: string) => {
    if (!window.confirm('Delete this admin account?')) return;
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('admin_id', admin_id);
    if (error) {
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Admin Deleted', description: 'Admin account removed.' });
      fetchAdmins();
    }
  };

  const filteredAdmins = admins.filter(
    a =>
      a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.admin_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-8">
      
      <div className="mb-8 flex items-center space-x-3">

      <Button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="bg-gray-200 text-gray-800 hover:bg-blue-600 hover:text-white"
        >
          Back to Dashboard
        </Button>
        <Users className="h-7 w-7 text-indigo-600" />
        <h2 className="text-2xl font-bold">Admins</h2>


      </div>
      <Card className="mb-8">
  <CardHeader>
    <CardTitle>Add Administrator</CardTitle>
    <CardDescription>Fill in the details and click add admin</CardDescription>
  </CardHeader>
  <CardContent>
    <form
      onSubmit={handleAddAdmin}
      className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0"
    >
      <Input
        id="display_name"
        name="display_name"
        required
        value={formData.display_name}
        onChange={handleInputChange}
        placeholder="Full Name"
        className="flex-1"
      />
      <Input
        id="email"
        name="email"
        type="email"
        required
        value={formData.email}
        onChange={handleInputChange}
        placeholder="admin@example.com"
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={isLoading}
        className="bg-indigo-600 text-white hover:bg-indigo-700 w-full sm:w-auto"
      >
        {isLoading ? 'Adding...' : 'Add Admin'}
      </Button>
    </form>
  </CardContent>
</Card>


      <Card>
        <CardHeader>
          <CardTitle>Admins</CardTitle>
          <CardDescription>All admin records, searchable</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            className="mb-4"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or admin ID ..."
          />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Admin ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Added On</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No admins found
                    </td>
                  </tr>
                )}
                {filteredAdmins.map((a) => (
                  <tr key={a.admin_id} className="border-t text-sm">
                    <td className="px-4 py-2 font-mono">{a.admin_id}</td>
                    <td className="px-4 py-2">{a.display_name}</td>
                    <td className="px-4 py-2">{a.email}</td>
                    <td className="px-4 py-2">
                      <span className={a.enabled ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {a.enabled ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeleteAdmin(a.admin_id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;
