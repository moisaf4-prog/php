import { useState, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Users, Search, RefreshCw, X, Check, Edit2, ArrowLeft, Trash2, Shield, CreditCard
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Link } from "react-router-dom";

export default function AdminUsers() {
  usePageTitle("User Management");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editExpiration, setEditExpiration] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search = "") => {
    setLoading(true);
    try {
      const url = search 
        ? `${API}/admin/users?search=${encodeURIComponent(search)}`
        : `${API}/admin/users`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handlePlanChange = async (userId, planId) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/plan?plan_id=${planId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Plan updated");
      fetchUsers(searchQuery);
    } catch (err) {
      toast.error("Failed to update plan");
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/role?role=${role}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Role updated");
      fetchUsers(searchQuery);
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("User deleted");
      fetchUsers(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleExpirationEdit = (user) => {
    setEditingUser(user.id);
    const date = user.plan_expires ? new Date(user.plan_expires).toISOString().split('T')[0] : '';
    setEditExpiration(date);
  };

  const handleExpirationSave = async (userId) => {
    try {
      const isoDate = editExpiration ? new Date(editExpiration).toISOString() : null;
      await axios.put(`${API}/admin/users/${userId}/expiration`, {
        plan_expires: isoDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Expiration date updated");
      setEditingUser(null);
      fetchUsers(searchQuery);
    } catch (err) {
      toast.error("Failed to update expiration");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'basic': return 'text-blue-500';
      case 'premium': return 'text-emerald-500';
      case 'enterprise': return 'text-amber-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <Layout>
      <div data-testid="admin-users" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <Users className="w-7 h-7 text-blue-500" />
                User Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">Search and manage user accounts</p>
            </div>
          </div>
          <Button onClick={() => fetchUsers(searchQuery)} variant="ghost" className="text-slate-400 hover:text-blue-500 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                data-testid="user-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or Telegram ID..."
                className="pl-11 h-11 bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6">
              Search
            </Button>
            {searchQuery && (
              <Button type="button" variant="ghost" onClick={() => { setSearchQuery(""); fetchUsers(); }} className="text-slate-400 hover:text-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </Button>
            )}
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-slate-100">{users.length}</p>
            <p className="text-xs text-slate-500">Total Users</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-emerald-500">{users.filter(u => u.plan !== 'free').length}</p>
            <p className="text-xs text-slate-500">Paid Users</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-amber-500">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-xs text-slate-500">Admins</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-red-500">{users.filter(u => u.plan !== 'free' && isExpired(u.plan_expires)).length}</p>
            <p className="text-xs text-slate-500">Expired</p>
          </div>
        </div>

        {/* Users Grid */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-slate-900 rounded-xl p-12 text-center border border-slate-800">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            users.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      user.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {user.username[0].toUpperCase()}
                    </div>
                    
                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{user.username}</span>
                        {user.role === 'admin' && (
                          <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-500 rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <SiTelegram className="w-3 h-3" /> {user.telegram_id}
                        </span>
                        <span className="text-sm text-slate-600">•</span>
                        <span className="text-sm text-slate-500">Created {formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Plan */}
                    <div className="text-right mr-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className={`w-4 h-4 ${getPlanColor(user.plan)}`} />
                        <Select defaultValue={user.plan} onValueChange={(val) => handlePlanChange(user.id, val)}>
                          <SelectTrigger className="w-28 h-8 bg-slate-800 border-slate-700 text-slate-100 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="free" className="text-slate-400">Free</SelectItem>
                            <SelectItem value="basic" className="text-blue-500">Basic</SelectItem>
                            <SelectItem value="premium" className="text-emerald-500">Premium</SelectItem>
                            <SelectItem value="enterprise" className="text-amber-500">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {user.plan !== 'free' && (
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          {editingUser === user.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="date"
                                value={editExpiration}
                                onChange={(e) => setEditExpiration(e.target.value)}
                                className="w-32 h-6 bg-slate-800 border-slate-700 text-slate-100 text-xs rounded px-2"
                              />
                              <Button size="icon" variant="ghost" onClick={() => handleExpirationSave(user.id)} className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10 rounded">
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingUser(null)} className="h-6 w-6 text-red-500 hover:bg-red-500/10 rounded">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <button onClick={() => handleExpirationEdit(user)} className={`text-xs flex items-center gap-1 hover:text-blue-500 ${
                              isExpired(user.plan_expires) ? 'text-red-500' : 'text-slate-500'
                            }`}>
                              Expires: {formatDate(user.plan_expires)}
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Role */}
                    <Select defaultValue={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                      <SelectTrigger className="w-24 h-8 bg-slate-800 border-slate-700 text-slate-100 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="user" className="text-slate-300">User</SelectItem>
                        <SelectItem value="admin" className="text-amber-500">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Delete */}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="h-8 w-8 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {!loading && users.length > 0 && (
          <p className="text-slate-500 text-sm text-center">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Layout>
  );
}