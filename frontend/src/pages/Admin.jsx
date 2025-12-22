import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Shield, Users, Target, DollarSign, Activity, Clock, RefreshCw, TrendingUp
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, attacksRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/attacks`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAttacks(attacksRes.data);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (userId, planId) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/plan?plan_id=${planId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Plan updated");
      fetchData();
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
      fetchData();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const pieData = stats ? [
    { name: "Free", value: stats.plan_distribution?.free || 0, color: "#888888" },
    { name: "Basic", value: stats.plan_distribution?.basic || 0, color: "#00F0FF" },
    { name: "Premium", value: stats.plan_distribution?.premium || 0, color: "#00FF94" },
    { name: "Enterprise", value: stats.plan_distribution?.enterprise || 0, color: "#FF003C" },
  ].filter(d => d.value > 0) : [];

  const formatDate = (iso) => new Date(iso).toLocaleString();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="admin-panel" className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-cyber-text tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyber-secondary" />
              ADMIN PANEL
            </h1>
            <p className="text-cyber-muted mt-1">System overview and user management</p>
          </div>
          <Button
            onClick={fetchData}
            variant="ghost"
            className="text-cyber-muted hover:text-cyber-primary"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cyber-surface border border-cyber-border p-6"
          >
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-cyber-primary" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Total Users</p>
                <p className="font-heading text-3xl font-bold text-cyber-text">{stats?.total_users || 0}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-cyber-surface border border-cyber-border p-6"
          >
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-cyber-accent" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Total Attacks</p>
                <p className="font-heading text-3xl font-bold text-cyber-text">{stats?.total_attacks || 0}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-cyber-surface border border-cyber-border p-6"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyber-secondary" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Running Now</p>
                <p className="font-heading text-3xl font-bold text-cyber-secondary">{stats?.running_attacks || 0}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-cyber-surface border border-cyber-primary/30 p-6"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-cyber-primary" />
              <div>
                <p className="text-xs text-cyber-muted uppercase">Total Revenue</p>
                <p className="font-heading text-3xl font-bold text-cyber-primary">${stats?.total_revenue?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Plan Distribution */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-cyber-surface border border-cyber-border p-6"
          >
            <h2 className="font-heading text-lg font-bold text-cyber-text mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyber-primary" />
              PLAN DISTRIBUTION
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "#0A0A0A", border: "1px solid #222222" }}
                    itemStyle={{ color: "#EDEDED" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-cyber-surface border border-cyber-border p-6"
          >
            <h2 className="font-heading text-lg font-bold text-cyber-text mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyber-accent" />
              RECENT ATTACKS
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {attacks.slice(0, 10).map((attack) => (
                <div key={attack.id} className="flex items-center justify-between p-3 bg-cyber-highlight border border-cyber-border">
                  <div>
                    <p className="font-code text-sm text-cyber-text">{attack.target}</p>
                    <p className="text-xs text-cyber-muted">{attack.method} • {attack.duration}s</p>
                  </div>
                  <div className={`px-2 py-1 text-xs font-code uppercase ${
                    attack.status === "running" ? "bg-cyber-primary/20 text-cyber-primary" :
                    attack.status === "completed" ? "bg-cyber-accent/20 text-cyber-accent" :
                    "bg-cyber-muted/20 text-cyber-muted"
                  }`}>
                    {attack.status}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-cyber-surface border border-cyber-border overflow-hidden"
        >
          <div className="p-6 border-b border-cyber-border">
            <h2 className="font-heading text-lg font-bold text-cyber-text flex items-center gap-2">
              <Users className="w-5 h-5 text-cyber-primary" />
              USER MANAGEMENT
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyber-border bg-cyber-highlight">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Username</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Telegram</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Role</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Plan</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-cyber-border hover:bg-cyber-highlight/50">
                    <td className="py-3 px-4 font-code text-cyber-text">{u.username}</td>
                    <td className="py-3 px-4 text-cyber-muted">{u.telegram_id}</td>
                    <td className="py-3 px-4">
                      <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val)}>
                        <SelectTrigger className="w-28 bg-cyber-highlight border-cyber-border text-cyber-text text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-surface border-cyber-border">
                          <SelectItem value="user" className="text-cyber-text">User</SelectItem>
                          <SelectItem value="admin" className="text-cyber-secondary">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4">
                      <Select defaultValue={u.plan} onValueChange={(val) => handlePlanChange(u.id, val)}>
                        <SelectTrigger className="w-32 bg-cyber-highlight border-cyber-border text-cyber-text text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-cyber-surface border-cyber-border">
                          <SelectItem value="free" className="text-cyber-muted">Free</SelectItem>
                          <SelectItem value="basic" className="text-cyber-accent">Basic</SelectItem>
                          <SelectItem value="premium" className="text-cyber-primary">Premium</SelectItem>
                          <SelectItem value="enterprise" className="text-cyber-secondary">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-cyber-muted text-sm">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
