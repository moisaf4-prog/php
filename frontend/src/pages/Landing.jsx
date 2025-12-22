import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API, useAuth, useTheme } from "../App";
import { Button } from "../components/ui/button";
import { 
  Zap, Target, Users, Activity, Server, ArrowRight, 
  Moon, Sun, Shield, Cpu, HardDrive, CreditCard
} from "lucide-react";
import { SiLitecoin, SiMonero, SiTether, SiSolana } from "react-icons/si";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/public/stats`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLoadColor = (percent) => {
    if (percent < 50) return "bg-emerald-500";
    if (percent < 80) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-100">Layer7<span className="text-blue-500">Top</span></span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/faq">
              <Button variant="ghost" className="text-slate-400 hover:text-slate-100 font-medium">
                FAQ
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-slate-400 hover:text-blue-500 hover:bg-slate-800 rounded-lg"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-slate-400 hover:text-slate-100 font-medium">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              Layer 7 Stress Testing Platform
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-100 mb-6 leading-tight">
              Professional Web
              <span className="text-blue-500"> Stress Testing</span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
              Test your infrastructure's resilience with our advanced Layer 7 attack simulation platform. HTTP floods, Slowloris, CF bypass, and more.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
              <Link to="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-8 h-12">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl px-8 h-12">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Crypto badges */}
            <div className="flex items-center justify-center gap-4 text-slate-500">
              <span className="text-sm">Crypto accepted:</span>
              <div className="flex items-center gap-3">
                <SiLitecoin className="w-5 h-5 hover:text-blue-400 transition-colors" />
                <SiMonero className="w-5 h-5 hover:text-blue-400 transition-colors" />
                <SiTether className="w-5 h-5 hover:text-blue-400 transition-colors" />
                <SiSolana className="w-5 h-5 hover:text-blue-400 transition-colors" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Cards */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900 rounded-xl p-6 border border-slate-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-100">{stats?.total_users || 0}</p>
              <p className="text-slate-500 text-sm">Total Users</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-slate-900 rounded-xl p-6 border border-slate-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-500">{stats?.paid_users || 0}</p>
              <p className="text-slate-500 text-sm">Paid Users</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-slate-900 rounded-xl p-6 border border-slate-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-cyan-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-100">{stats?.total_attacks || 0}</p>
              <p className="text-slate-500 text-sm">Total Attacks</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900 rounded-xl p-6 border border-slate-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-100">{stats?.attacks_24h || 0}</p>
              <p className="text-slate-500 text-sm">Attacks (24h)</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-slate-900 rounded-xl p-6 border border-slate-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Server className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-500">
                {stats?.online_servers || 0}<span className="text-slate-500 text-lg">/{stats?.total_servers || 0}</span>
              </p>
              <p className="text-slate-500 text-sm">Servers Online</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Attacks Chart - Last 24 Hours */}
      {stats?.attacks_per_hour?.length > 0 && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Attacks Last 24 Hours
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.attacks_per_hour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fill: "#64748b", fontSize: 11 }} 
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: "#64748b", fontSize: 11 }} 
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: "#0f172a", 
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#f1f5f9"
                      }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attacks" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: "#3b82f6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* System Resources */}
      {(stats?.total_ram_total > 0 || stats?.avg_cpu > 0) && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                System Resources
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Average CPU</span>
                    <span className="text-slate-100 font-medium">{stats?.avg_cpu || 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getLoadColor(stats?.avg_cpu || 0)}`}
                      style={{ width: `${stats?.avg_cpu || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Total RAM</span>
                    <span className="text-slate-100 font-medium">{stats?.total_ram_used || 0}GB / {stats?.total_ram_total || 0}GB</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getLoadColor(stats?.total_ram_total ? (stats?.total_ram_used / stats?.total_ram_total) * 100 : 0)}`}
                      style={{ width: `${stats?.total_ram_total ? (stats?.total_ram_used / stats?.total_ram_total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Server Status */}
      {stats?.servers?.length > 0 && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              Server Status
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.servers.map((server, idx) => {
                const loadPercent = server.max_concurrent ? (server.load / server.max_concurrent) * 100 : 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-slate-900 rounded-xl p-5 border border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${server.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                        <span className="font-medium text-slate-100">{server.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        server.status === "online" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {server.status}
                      </span>
                    </div>
                    
                    {/* Load bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Load</span>
                        <span>{server.load}/{server.max_concurrent}</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${getLoadColor(loadPercent)}`}
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* CPU & RAM */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">CPU:</span>
                        <span className="text-slate-100 font-medium">{server.cpu_usage || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">RAM:</span>
                        <span className="text-slate-100 font-medium">{server.ram_used || 0}/{server.ram_total || 0}GB</span>
                      </div>
                    </div>
                    
                    {/* Methods */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {server.methods?.slice(0, 3).map((method, i) => (
                        <span key={i} className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {method}
                        </span>
                      ))}
                      {server.methods?.length > 3 && (
                        <span className="text-xs text-slate-500">+{server.methods.length - 3}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-4">Why Choose Us</h2>
            <p className="text-slate-400">Enterprise-grade stress testing at your fingertips</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">8 Attack Methods</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                HTTP Flood, Slowloris, TLS Bypass, CF Bypass, Browser Emulation and more advanced Layer 7 techniques.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">API Access</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Full REST API for automated testing. Integrate stress tests into your CI/CD pipeline seamlessly.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Real-time Stats</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Monitor attacks in real-time. View server load, CPU, RAM, and detailed attack logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-8">Simple, Transparent Pricing</h2>
          
          <div className="flex items-center justify-center gap-8 flex-wrap mb-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-100">$0</p>
              <p className="text-slate-500 text-sm">Free</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">$19.99</p>
              <p className="text-slate-500 text-sm">Basic</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500">$49.99</p>
              <p className="text-slate-500 text-sm">Premium</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">$99.99</p>
              <p className="text-slate-500 text-sm">Enterprise</p>
            </div>
          </div>
          
          <Link to="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-8">
              View All Plans <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-100">Layer7Top</span>
          </div>
          <p className="text-slate-500 text-sm">
            Layer 7 Stress Testing Platform • layer7top.st • For authorized testing only
          </p>
        </div>
      </footer>
    </div>
  );
}
