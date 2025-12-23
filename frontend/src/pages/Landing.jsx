import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API, useAuth, useTheme } from "../App";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/ui/button";
import Footer from "../components/Footer";
import { 
  Zap, Target, Users, Activity, Server, ArrowRight, 
  Moon, Sun, Shield, Cpu, HardDrive, CreditCard, Newspaper, Bell, ExternalLink, HelpCircle, Clock
} from "lucide-react";
import { SiLitecoin, SiMonero, SiTether, SiSolana, SiTelegram } from "react-icons/si";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Landing() {
  usePageTitle(null); // Uses default title
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [news, setNews] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, newsRes, plansRes] = await Promise.all([
        axios.get(`${API}/public/stats`),
        axios.get(`${API}/news`),
        axios.get(`${API}/plans`)
      ]);
      setStats(statsRes.data);
      setNews(newsRes.data);
      setPlans(plansRes.data);
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

  const getPlanColor = (planId) => {
    switch(planId) {
      case 'free': return 'border-slate-700 bg-slate-900';
      case 'basic': return 'border-blue-500/50 bg-blue-500/5';
      case 'premium': return 'border-emerald-500/50 bg-emerald-500/5';
      case 'enterprise': return 'border-amber-500/50 bg-amber-500/5';
      default: return 'border-slate-700 bg-slate-900';
    }
  };

  const getPlanTextColor = (planId) => {
    switch(planId) {
      case 'free': return 'text-slate-100';
      case 'basic': return 'text-blue-500';
      case 'premium': return 'text-emerald-500';
      case 'enterprise': return 'text-amber-500';
      default: return 'text-slate-100';
    }
  };

  const getNewsTypeColor = (type) => {
    switch (type) {
      case "update": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "alert": return "bg-red-500/10 text-red-400 border-red-500/30";
      case "promo": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-100">Layer7<span className="text-blue-500">Top</span></span>
              <p className="text-[10px] text-slate-500 -mt-1">layer7top.st</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/faq" className="hidden md:flex">
              <Button variant="ghost" className="text-slate-400 hover:text-slate-100 font-medium gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </Button>
            </Link>
            
            <a href="https://t.me/layer7top" target="_blank" rel="noopener noreferrer" className="hidden md:flex">
              <Button variant="ghost" className="text-slate-400 hover:text-blue-500 font-medium gap-2">
                <SiTelegram className="w-4 h-4" />
                Support
              </Button>
            </a>
            
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

      {/* Main Content */}
      <main className="flex-1">
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500"> Stress Testing</span>
              </h1>
              
              <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
                Test your infrastructure's resilience with advanced Layer 7 attack simulation. HTTP floods, Slowloris, CF bypass, and more.
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
                  <SiLitecoin className="w-5 h-5 hover:text-blue-400 transition-colors cursor-pointer" />
                  <SiMonero className="w-5 h-5 hover:text-orange-400 transition-colors cursor-pointer" />
                  <SiTether className="w-5 h-5 hover:text-green-400 transition-colors cursor-pointer" />
                  <SiSolana className="w-5 h-5 hover:text-purple-400 transition-colors cursor-pointer" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* News Section */}
        {news.length > 0 && (
          <section className="py-6 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-100">Latest News</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.slice(0, 3).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getNewsTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{item.content}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Live Stats Cards */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-100">{stats?.total_users || 0}</p>
                <p className="text-slate-500 text-sm">Total Users</p>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-emerald-500">{stats?.paid_users || 0}</p>
                <p className="text-slate-500 text-sm">Paid Users</p>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-cyan-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-100">{stats?.total_attacks || 0}</p>
                <p className="text-slate-500 text-sm">Total Attacks</p>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-100">{stats?.attacks_24h || 0}</p>
                <p className="text-slate-500 text-sm">Attacks (24h)</p>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
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

        {/* Attacks Chart */}
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
                      <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f1f5f9" }} labelStyle={{ color: "#94a3b8" }} />
                      <Line type="monotone" dataKey="attacks" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#3b82f6" }} />
                    </LineChart>
                  </ResponsiveContainer>
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
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-slate-900 rounded-xl p-5 border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${server.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                          <span className="font-medium text-slate-100">{server.name}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${server.status === "online" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                          {server.status}
                        </span>
                      </div>
                      
                      {/* CPU Model */}
                      {server.cpu_model && server.cpu_model !== "N/A" && (
                        <div className="mb-3 p-2 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-blue-400 font-medium truncate">
                              {server.cpu_model} {server.cpu_cores ? `(${server.cpu_cores} Cores)` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Load</span>
                          <span>{server.load}/{server.max_concurrent}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${getLoadColor(loadPercent)}`} style={{ width: `${loadPercent}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-400 text-xs">CPU</span>
                            <span className="text-slate-100 font-medium text-xs">{server.cpu_usage || 0}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all ${server.cpu_usage > 80 ? 'bg-red-500' : server.cpu_usage > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${server.cpu_usage || 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-400 text-xs">RAM</span>
                            <span className="text-slate-100 font-medium text-xs">{server.ram_used || 0}/{server.ram_total || 0}GB</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all ${(server.ram_used / server.ram_total * 100) > 80 ? 'bg-red-500' : (server.ram_used / server.ram_total * 100) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${server.ram_total ? (server.ram_used / server.ram_total * 100) : 0}%` }} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Uptime */}
                      {server.uptime && server.uptime !== "N/A" && (
                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <div className="flex items-center gap-2 text-xs">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-slate-500">Uptime:</span>
                            <span className="text-emerald-400 font-medium">{server.uptime}</span>
                          </div>
                        </div>
                      )}
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
              <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-4">Why Choose Layer7Top</h2>
              <p className="text-slate-400">Enterprise-grade stress testing at your fingertips</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">8 Attack Methods</h3>
                <p className="text-slate-400 text-sm leading-relaxed">HTTP Flood, Slowloris, TLS Bypass, CF Bypass, Browser Emulation and more.</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">API Access</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Full REST API for automated testing. Integrate into your CI/CD pipeline.</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Real-time Stats</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Monitor attacks in real-time. View server load, CPU, RAM, and detailed logs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-16 px-6 bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-slate-400">Choose the plan that fits your testing needs</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <motion.div 
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-6 border ${getPlanColor(plan.id)}`}
                >
                  <h3 className={`text-lg font-bold mb-2 ${getPlanTextColor(plan.id)}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-3xl font-bold ${getPlanTextColor(plan.id)}`}>
                      ${plan.price || 0}
                    </span>
                    {plan.duration_days && <span className="text-slate-500 text-sm">/{plan.duration_days} days</span>}
                  </div>
                  <ul className="space-y-2 text-sm text-slate-400 mb-6">
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      Max {plan.max_time}s per attack
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      {plan.max_concurrent} concurrent
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-slate-500" />
                      {plan.methods?.length || 0} methods
                    </li>
                  </ul>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-8">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
