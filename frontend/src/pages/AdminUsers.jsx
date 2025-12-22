import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Users, Search, Calendar, RefreshCw, X, Check, Edit2, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminUsers() {
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

  const handleExpirationEdit = (user) => {
    setEditingUser(user.id);
    // Convert ISO date to input format (YYYY-MM-DD)
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
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <Layout>
      <div data-testid="admin-users" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-panel-muted hover:text-panel rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-panel flex items-center gap-3">
                <Users className="w-7 h-7 text-panel-primary" />
                User Management
              </h1>
              <p className="text-panel-muted text-sm mt-1">Search and manage user accounts</p>
            </div>
          </div>
          <Button onClick={() => fetchUsers(searchQuery)} variant="ghost" className="text-panel-muted hover:text-panel-primary rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-panel-surface rounded-xl p-4 border border-panel">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-panel-muted" />
              <Input
                data-testid="user-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or Telegram ID..."
                className="pl-11 h-11 bg-panel-hover border-panel text-panel rounded-lg"
              />
            </div>
            <Button type="submit" className="bg-panel-primary hover:bg-panel-primary/90 text-white rounded-lg px-6">
              Search
            </Button>
            {searchQuery && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => { setSearchQuery(""); fetchUsers(); }}
                className="text-panel-muted hover:text-panel rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-panel-surface rounded-xl border border-panel overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-panel-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-panel-muted">
                <Users className="w-12 h-12 mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-panel-hover">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-panel-muted uppercase tracking-wider">Username</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-panel-muted uppercase tracking-wider">Telegram</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-panel-muted uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-panel-muted uppercase tracking-wider">Plan</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-panel-muted uppercase tracking-wider">Expires</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-panel-muted uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <motion.tr 
                      key={user.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-panel hover:bg-panel-hover/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-panel">{user.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-panel-muted text-sm">{user.telegram_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Select defaultValue={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                          <SelectTrigger className="w-24 h-8 bg-panel-hover border-panel text-panel text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-panel-surface border-panel rounded-lg">
                            <SelectItem value="user" className="text-panel">User</SelectItem>
                            <SelectItem value="admin" className="text-panel-warning">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Select defaultValue={user.plan} onValueChange={(val) => handlePlanChange(user.id, val)}>
                          <SelectTrigger className="w-28 h-8 bg-panel-hover border-panel text-panel text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-panel-surface border-panel rounded-lg">
                            <SelectItem value="free" className="text-panel-muted">Free</SelectItem>
                            <SelectItem value="basic" className="text-panel-primary">Basic</SelectItem>
                            <SelectItem value="premium" className="text-panel-success">Premium</SelectItem>
                            <SelectItem value="enterprise" className="text-panel-warning">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={editExpiration}
                              onChange={(e) => setEditExpiration(e.target.value)}
                              className="w-36 h-8 bg-panel-hover border-panel text-panel text-xs rounded-lg"
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleExpirationSave(user.id)}
                              className="h-8 w-8 text-panel-success hover:bg-panel-success/10 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => setEditingUser(null)}
                              className="h-8 w-8 text-panel-danger hover:bg-panel-danger/10 rounded"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${
                              user.plan === 'free' 
                                ? 'text-panel-muted' 
                                : isExpired(user.plan_expires)
                                  ? 'text-panel-danger'
                                  : 'text-panel'
                            }`}>
                              {user.plan === 'free' ? '—' : formatDate(user.plan_expires)}
                            </span>
                            {user.plan !== 'free' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleExpirationEdit(user)}
                                className="h-6 w-6 text-panel-muted hover:text-panel-primary rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-panel-muted text-sm">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Results count */}
        {!loading && users.length > 0 && (
          <p className="text-panel-muted text-sm text-center">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Layout>
  );
}
