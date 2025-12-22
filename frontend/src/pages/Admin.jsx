import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Shield, Users, Target, DollarSign, Activity, Clock, RefreshCw, TrendingUp, 
  TrendingDown, Minus, Server, Cpu, HardDrive
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
      toast.error("Failed to load data");
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
      toast.error("Failed");
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
      toast.error("Failed");
    }
  };

  const pieData = stats ? [
    { name: "Free", value: stats.plan_distribution?.free || 0, color: "#8b949e" },
    { name: "Basic", value: stats.plan_distribution?.basic || 0, color: "#58a6ff" },
    { name: "Premium", value: stats.plan_distribution?.premium || 0, color: "#3fb950" },
    { name: "Enterprise", value: stats.plan_distribution?.enterprise || 0, color: "#d29922" },
  ].filter(d => d.value > 0) : [];

  const getTrendIcon = (trend) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-panel-success" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-panel-danger" />;
    return <Minus className="w-4 h-4 text-panel-muted" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-panel-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="admin-panel" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-panel flex items-center gap-3">
              <Shield className="w-7 h-7 text-panel-primary" />
              Admin Dashboard
            </h1>
            <p className="text-panel-muted text-sm mt-1">System overview and management</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/servers">
              <Button variant="outline" className="border-panel text-panel hover:bg-panel-hover rounded-lg">
                <Server className="w-4 h-4 mr-2" />
                Servers
              </Button>
            </Link>
            <Button onClick={fetchData} variant="ghost" className="text-panel-muted hover:text-panel-primary rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-panel-surface rounded-xl p-4 border border-panel">
            <Users className="w-5 h-5 text-panel-primary mb-2" />
            <p className="text-2xl font-bold text-panel">{stats?.total_users || 0}</p>
            <p className="text-xs text-panel-muted">Total Users</p>
          </div>
          <div className="bg-panel-surface rounded-xl p-4 border border-panel">
            <Users className="w-5 h-5 text-panel-success mb-2" />
            <p className="text-2xl font-bold text-panel-success">{stats?.paid_users || 0}</p>
            <p className="text-xs text-panel-muted">Paid Users</p>
          </div>
          <div className="bg-panel-surface rounded-xl p-4 border border-panel">
            <TrendingUp className="w-5 h-5 text-panel-warning mb-2" />
            <p className="text-2xl font-bold text-panel">{stats?.users_today || 0}</p>
            <p className="text-xs text-panel-muted">New Today</p>
          </div>
          <div className="bg-panel-surface rounded-xl p-4 border border-panel">
            <Target className="w-5 h-5 text-panel-primary mb-2" />
            <p className="text-2xl font-bold text-panel">{stats?.total_attacks || 0}</p>
            <p className="text-xs text-panel-muted">Total Attacks</p>
          </div>
          <div className="bg-panel-surface rounded-xl p-4 border border-panel">
            <Activity className="w-5 h-5 text-panel-danger mb-2" />
            <p className="text-2xl font-bold text-panel-danger">{stats?.running_attacks || 0}</p>
            <p className="text-xs text-panel-muted">Running Now</p>
          </div>
          <div className="bg-panel-surface rounded-xl p-4 border border-panel">
            <DollarSign className="w-5 h-5 text-panel-success mb-2" />
            <p className="text-2xl font-bold text-panel-success">${stats?.total_revenue?.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-panel-muted">Revenue</p>
          </div>
        </div>

        {/* System Resources */}
        <div className="bg-panel-surface rounded-xl p-5 border border-panel">
          <h3 className="text-sm font-semibold text-panel mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-panel-primary" />
            System Resources
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-panel-muted">Servers</span>
                <span className="text-panel font-medium">{stats?.online_servers || 0}/{stats?.total_servers || 0} online</span>
              </div>
              <div className="h-2 bg-panel-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-panel-success transition-all"
                  style={{ width: `${stats?.total_servers ? (stats?.online_servers / stats?.total_servers) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-panel-muted">Capacity</span>
                <span className="text-panel font-medium">{stats?.running_attacks || 0}/{stats?.total_capacity || 0}</span>
              </div>
              <div className="h-2 bg-panel-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-panel-primary transition-all"
                  style={{ width: `${stats?.total_capacity ? (stats?.running_attacks / stats?.total_capacity) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-panel-muted">Avg CPU</span>
                <span className="text-panel font-medium">{stats?.avg_cpu || 0}%</span>
              </div>
              <div className="h-2 bg-panel-hover rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${stats?.avg_cpu > 80 ? 'bg-panel-danger' : stats?.avg_cpu > 50 ? 'bg-panel-warning' : 'bg-panel-success'}`}
                  style={{ width: `${stats?.avg_cpu || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-panel-muted">Total RAM</span>
                <span className="text-panel font-medium">{stats?.total_ram_used || 0}GB/{stats?.total_ram_total || 0}GB</span>
              </div>
              <div className="h-2 bg-panel-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-panel-primary transition-all"
                  style={{ width: `${stats?.total_ram_total ? (stats?.total_ram_used / stats?.total_ram_total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Attacks Table */}
        <div className="bg-panel-surface rounded-xl border border-panel overflow-hidden">
          <div className="p-5 border-b border-panel">
            <h3 className="text-sm font-semibold text-panel flex items-center gap-2">
              <Clock className="w-4 h-4 text-panel-primary" />
              Attacks Last 24 Hours (Hourly)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-panel-hover">
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Hour</th>
                  <th className="text-center py-2 px-4 text-xs font-medium text-panel-muted">Attacks</th>
                  <th className="text-center py-2 px-4 text-xs font-medium text-panel-muted">Trend</th>
                  <th className="text-center py-2 px-4 text-xs font-medium text-panel-muted">Change</th>
                </tr>
              </thead>
              <tbody>
                {stats?.attacks_per_hour?.map((hour, idx) => (
                  <tr key={idx} className="border-t border-panel hover:bg-panel-hover/50 transition-colors">
                    <td className="py-2 px-4 font-mono text-sm text-panel">{hour.hour}</td>
                    <td className="py-2 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded bg-panel-primary/10 text-panel-primary text-sm font-medium">
                        {hour.attacks}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      {getTrendIcon(hour.trend)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`text-sm font-medium ${
                        hour.change > 0 ? 'text-panel-success' : 
                        hour.change < 0 ? 'text-panel-danger' : 'text-panel-muted'
                      }`}>
                        {hour.change > 0 ? '+' : ''}{hour.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Distribution */}
          <div className="bg-panel-surface rounded-xl p-5 border border-panel">
            <h3 className="text-sm font-semibold text-panel mb-4">Plan Distribution</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--panel-surface)", 
                      border: "1px solid var(--panel-border)",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Chart */}
          <div className="bg-panel-surface rounded-xl p-5 border border-panel">
            <h3 className="text-sm font-semibold text-panel mb-4">Hourly Activity</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.attacks_per_hour?.slice(-12) || []}>
                  <XAxis dataKey="hour" tick={{ fill: "var(--panel-muted)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "var(--panel-muted)", fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--panel-surface)", 
                      border: "1px solid var(--panel-border)",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="attacks" fill="var(--panel-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Attacks */}
        <div className="bg-panel-surface rounded-xl border border-panel overflow-hidden">
          <div className="p-5 border-b border-panel">
            <h3 className="text-sm font-semibold text-panel flex items-center gap-2">
              <Activity className="w-4 h-4 text-panel-warning" />
              Recent Attacks
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-panel-hover">
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Status</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Target</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Method</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Server</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Duration</th>
                </tr>
              </thead>
              <tbody>
                {attacks.slice(0, 10).map((attack) => (
                  <tr key={attack.id} className="border-t border-panel hover:bg-panel-hover/50">
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                        attack.status === "running" ? "bg-panel-success/10 text-panel-success" :
                        attack.status === "completed" ? "bg-panel-primary/10 text-panel-primary" :
                        "bg-panel-muted/10 text-panel-muted"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          attack.status === "running" ? "bg-panel-success animate-pulse" : "bg-current"
                        }`} />
                        {attack.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-mono text-sm text-panel">{attack.target}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-0.5 bg-panel-hover rounded text-xs text-panel-muted">
                        {attack.method}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-panel-muted">{attack.server_name || "N/A"}</td>
                    <td className="py-2 px-4 text-sm text-panel">{attack.duration}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-panel-surface rounded-xl border border-panel overflow-hidden">
          <div className="p-5 border-b border-panel">
            <h3 className="text-sm font-semibold text-panel flex items-center gap-2">
              <Users className="w-4 h-4 text-panel-primary" />
              User Management
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-panel-hover">
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Username</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Telegram</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Role</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-panel-muted">Plan</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map((u) => (
                  <tr key={u.id} className="border-t border-panel hover:bg-panel-hover/50">
                    <td className="py-2 px-4 font-medium text-panel">{u.username}</td>
                    <td className="py-2 px-4 text-panel-muted text-sm">{u.telegram_id}</td>
                    <td className="py-2 px-4">
                      <Select defaultValue={u.role} onValueChange={(val) => handleRoleChange(u.id, val)}>
                        <SelectTrigger className="w-24 h-8 bg-panel-hover border-panel text-panel text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-panel-surface border-panel rounded-lg">
                          <SelectItem value="user" className="text-panel">User</SelectItem>
                          <SelectItem value="admin" className="text-panel-warning">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-4">
                      <Select defaultValue={u.plan} onValueChange={(val) => handlePlanChange(u.id, val)}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
