import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Shield, Users, Target, DollarSign, Activity, RefreshCw, 
  Server, Cpu, Zap, Plus, Edit2, Trash2, Save, X
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState(null);
  const [newMethod, setNewMethod] = useState({ id: "", name: "", description: "" });
  const [showAddMethod, setShowAddMethod] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, attacksRes, methodsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/attacks`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/methods`)
      ]);
      setStats(statsRes.data);
      setAttacks(attacksRes.data);
      setMethods(methodsRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async () => {
    if (!newMethod.id || !newMethod.name) {
      toast.error("ID and Name are required");
      return;
    }
    try {
      await axios.post(`${API}/admin/methods`, newMethod, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Method added");
      setNewMethod({ id: "", name: "", description: "" });
      setShowAddMethod(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add method");
    }
  };

  const handleUpdateMethod = async (methodId) => {
    try {
      await axios.put(`${API}/admin/methods/${methodId}`, editingMethod, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Method updated");
      setEditingMethod(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update method");
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (!confirm("Are you sure you want to delete this method?")) return;
    try {
      await axios.delete(`${API}/admin/methods/${methodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Method deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete method");
    }
  };

  const pieData = stats ? [
    { name: "Free", value: stats.plan_distribution?.free || 0, color: "#64748b" },
    { name: "Basic", value: stats.plan_distribution?.basic || 0, color: "#3b82f6" },
    { name: "Premium", value: stats.plan_distribution?.premium || 0, color: "#10b981" },
    { name: "Enterprise", value: stats.plan_distribution?.enterprise || 0, color: "#f59e0b" },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Shield className="w-7 h-7 text-blue-500" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">System overview and management</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/users">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg">
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link to="/admin/servers">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg">
                <Server className="w-4 h-4 mr-2" />
                Servers
              </Button>
            </Link>
            <Button onClick={fetchData} variant="ghost" className="text-slate-400 hover:text-blue-500 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Users className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-slate-100">{stats?.total_users || 0}</p>
            <p className="text-xs text-slate-500">Total Users</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Users className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-emerald-500">{stats?.paid_users || 0}</p>
            <p className="text-xs text-slate-500">Paid Users</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Target className="w-5 h-5 text-cyan-500 mb-2" />
            <p className="text-2xl font-bold text-slate-100">{stats?.total_attacks || 0}</p>
            <p className="text-xs text-slate-500">Total Attacks</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Activity className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-slate-100">{stats?.attacks_24h || 0}</p>
            <p className="text-xs text-slate-500">Attacks (24h)</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Activity className="w-5 h-5 text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-500">{stats?.running_attacks || 0}</p>
            <p className="text-xs text-slate-500">Running Now</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-emerald-500">${stats?.total_revenue?.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-slate-500">Revenue</p>
          </div>
        </div>

        {/* System Resources */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            System Resources
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Servers</span>
                <span className="text-slate-300 font-medium">{stats?.online_servers || 0}/{stats?.total_servers || 0} online</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${stats?.total_servers ? (stats?.online_servers / stats?.total_servers) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Capacity</span>
                <span className="text-slate-300 font-medium">{stats?.running_attacks || 0}/{stats?.total_capacity || 0}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${stats?.total_capacity ? (stats?.running_attacks / stats?.total_capacity) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Avg CPU</span>
                <span className="text-slate-300 font-medium">{stats?.avg_cpu || 0}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${stats?.avg_cpu > 80 ? 'bg-red-500' : stats?.avg_cpu > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${stats?.avg_cpu || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Total RAM</span>
                <span className="text-slate-300 font-medium">{stats?.total_ram_used || 0}GB/{stats?.total_ram_total || 0}GB</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${stats?.total_ram_total ? (stats?.total_ram_used / stats?.total_ram_total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attack Methods Management */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Attack Methods
            </h3>
            <Button 
              onClick={() => setShowAddMethod(true)} 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Method
            </Button>
          </div>
          
          {/* Add Method Form */}
          {showAddMethod && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 border-b border-slate-800 bg-slate-800/50"
            >
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Method ID</Label>
                  <Input
                    value={newMethod.id}
                    onChange={(e) => setNewMethod({ ...newMethod, id: e.target.value.toUpperCase().replace(/\s/g, '-') })}
                    placeholder="HTTP-GET"
                    className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Name</Label>
                  <Input
                    value={newMethod.name}
                    onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                    placeholder="HTTP GET Flood"
                    className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Description</Label>
                  <Input
                    value={newMethod.description}
                    onChange={(e) => setNewMethod({ ...newMethod, description: e.target.value })}
                    placeholder="Layer 7 GET request flood"
                    className="h-9 bg-slate-900 border-slate-700 text-slate-100 text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddMethod} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button onClick={() => setShowAddMethod(false)} size="sm" variant="ghost" className="text-slate-400 hover:text-slate-100">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Description</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                    {editingMethod?.id === method.id ? (
                      <>
                        <td className="py-2 px-4">
                          <span className="font-mono text-sm text-blue-400">{method.id}</span>
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={editingMethod.name}
                            onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                            className="h-8 bg-slate-800 border-slate-700 text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={editingMethod.description}
                            onChange={(e) => setEditingMethod({ ...editingMethod, description: e.target.value })}
                            className="h-8 bg-slate-800 border-slate-700 text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              onClick={() => handleUpdateMethod(method.id)} 
                              size="icon" 
                              className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button 
                              onClick={() => setEditingMethod(null)} 
                              size="icon" 
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-100"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-blue-400">{method.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-100">{method.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-400">{method.description}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              onClick={() => setEditingMethod({ ...method })} 
                              size="icon" 
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-blue-500"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteMethod(method.id)} 
                              size="icon" 
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Distribution */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Plan Distribution</h3>
            <div className="h-52">
              {pieData.length > 0 ? (
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
                        background: "#0f172a", 
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#f1f5f9"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Recent Attacks */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              Recent Attacks
            </h3>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {attacks.slice(0, 8).map((attack) => (
                <div key={attack.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      attack.status === "running" ? "bg-emerald-500 animate-pulse" :
                      attack.status === "completed" ? "bg-blue-500" : "bg-slate-500"
                    }`} />
                    <div>
                      <p className="text-sm text-slate-100 font-mono">{attack.target}</p>
                      <p className="text-xs text-slate-500">{attack.method} • {attack.duration}s</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    attack.status === "running" ? "bg-emerald-500/10 text-emerald-500" :
                    attack.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                    "bg-slate-500/10 text-slate-500"
                  }`}>
                    {attack.status}
                  </span>
                </div>
              ))}
              {attacks.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No attacks yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
