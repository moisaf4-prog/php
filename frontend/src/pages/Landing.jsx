import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API, useAuth, useTheme } from "../App";
import { Button } from "../components/ui/button";
import { 
  Zap, Target, Users, Activity, Server, ArrowRight, 
  Moon, Sun, Shield, Cpu, HardDrive, TrendingUp, CreditCard
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

  const getLoadPercent = (load, max) => Math.min((load / max) * 100, 100);
  const getLoadColor = (percent) => {
    if (percent < 50) return "bg-panel-success";
    if (percent < 80) return "bg-panel-warning";
    return "bg-panel-danger";
  };

  return (
    <div className="min-h-screen bg-panel">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-panel/80 backdrop-blur-xl border-b border-panel">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-panel-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-panel">Stresser<span className="text-panel-primary">.io</span></span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-panel-muted hover:text-panel-primary hover:bg-panel-hover rounded-lg"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-panel-primary hover:bg-panel-primary/90 text-white font-medium rounded-lg">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-panel-muted hover:text-panel font-medium">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-panel-primary hover:bg-panel-primary/90 text-white font-medium rounded-lg">
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-panel-primary/10 border border-panel-primary/20 text-panel-primary text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              Layer 7 Stress Testing Platform
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-panel mb-6 leading-tight">
              Professional Web
              <span className="text-panel-primary"> Stress Testing</span>
            </h1>
            
            <p className="text-panel-muted text-lg md:text-xl mb-10 leading-relaxed">
              Test your infrastructure's resilience with our advanced Layer 7 attack simulation platform. HTTP floods, Slowloris, CF bypass, and more.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
              <Link to="/register">
                <Button size="lg" className="bg-panel-primary hover:bg-panel-primary/90 text-white font-semibold rounded-xl px-8 h-12">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-panel text-panel hover:bg-panel-hover rounded-xl px-8 h-12">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Crypto badges */}
            <div className="flex items-center justify-center gap-4 text-panel-muted">
              <span className="text-sm">Crypto accepted:</span>
              <div className="flex items-center gap-3">
                <SiLitecoin className="w-5 h-5 hover:text-panel-primary transition-colors" />
                <SiMonero className="w-5 h-5 hover:text-panel-primary transition-colors" />
                <SiTether className="w-5 h-5 hover:text-panel-primary transition-colors" />
                <SiSolana className="w-5 h-5 hover:text-panel-primary transition-colors" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Cards */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-panel-surface rounded-xl p-6 border border-panel"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-panel-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-panel-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-panel">{stats?.total_users || 0}</p>
              <p className="text-panel-muted text-sm">Total Users</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-panel-surface rounded-xl p-6 border border-panel"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-panel-success/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-panel-success" />
                </div>
              </div>
              <p className="text-3xl font-bold text-panel">{stats?.total_attacks || 0}</p>
              <p className="text-panel-muted text-sm">Total Attacks</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-panel-surface rounded-xl p-6 border border-panel"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-panel-warning/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-panel-warning" />
                </div>
              </div>
              <p className="text-3xl font-bold text-panel">{stats?.attacks_24h || 0}</p>
              <p className="text-panel-muted text-sm">Attacks (24h)</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-panel-surface rounded-xl p-6 border border-panel"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-panel-primary/10 flex items-center justify-center">
                  <Server className="w-5 h-5 text-panel-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-panel-success">
                {stats?.online_servers || 0}<span className="text-panel-muted text-lg">/{stats?.total_servers || 0}</span>
              </p>
              <p className="text-panel-muted text-sm">Servers Online</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* System Resources */}
      {(stats?.total_ram_total > 0 || stats?.avg_cpu > 0) && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-panel-surface rounded-xl p-6 border border-panel">
              <h3 className="text-lg font-semibold text-panel mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-panel-primary" />
                System Resources
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-panel-muted">Average CPU</span>
                    <span className="text-panel font-medium">{stats?.avg_cpu || 0}%</span>
                  </div>
                  <div className="h-3 bg-panel-hover rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getLoadColor(stats?.avg_cpu || 0)}`}
                      style={{ width: `${stats?.avg_cpu || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-panel-muted">Total RAM</span>
                    <span className="text-panel font-medium">{stats?.total_ram_used || 0}GB / {stats?.total_ram_total || 0}GB</span>
                  </div>
                  <div className="h-3 bg-panel-hover rounded-full overflow-hidden">
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
            <h2 className="text-xl font-semibold text-panel mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-panel-primary" />
              Server Status
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.servers.map((server, idx) => {
                const loadPercent = getLoadPercent(server.load, server.max_concurrent);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-panel-surface rounded-xl p-5 border border-panel"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${server.status === "online" ? "bg-panel-success animate-pulse" : "bg-panel-danger"}`} />
                        <span className="font-medium text-panel">{server.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        server.status === "online" 
                          ? "bg-panel-success/10 text-panel-success" 
                          : "bg-panel-danger/10 text-panel-danger"
                      }`}>
                        {server.status}
                      </span>
                    </div>
                    
                    {/* Load bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-panel-muted mb-1">
                        <span>Load</span>
                        <span>{server.load}/{server.max_concurrent}</span>
                      </div>
                      <div className="h-2 bg-panel-hover rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${getLoadColor(loadPercent)}`}
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* CPU & RAM */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-panel-muted" />
                        <span className="text-panel-muted">CPU:</span>
                        <span className="text-panel font-medium">{server.cpu_usage || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-panel-muted" />
                        <span className="text-panel-muted">RAM:</span>
                        <span className="text-panel font-medium">{server.ram_used || 0}/{server.ram_total || 0}GB</span>
                      </div>
                    </div>
                    
                    {/* Methods */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {server.methods?.slice(0, 3).map((method, i) => (
                        <span key={i} className="text-xs bg-panel-hover px-2 py-0.5 rounded text-panel-muted">
                          {method}
                        </span>
                      ))}
                      {server.methods?.length > 3 && (
                        <span className="text-xs text-panel-muted">+{server.methods.length - 3}</span>
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
            <h2 className="text-2xl md:text-3xl font-bold text-panel mb-4">Why Choose Us</h2>
            <p className="text-panel-muted">Enterprise-grade stress testing at your fingertips</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-panel-surface rounded-xl p-6 border border-panel">
              <div className="w-12 h-12 rounded-xl bg-panel-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-panel-primary" />
              </div>
              <h3 className="text-lg font-semibold text-panel mb-2">8 Attack Methods</h3>
              <p className="text-panel-muted text-sm leading-relaxed">
                HTTP Flood, Slowloris, TLS Bypass, CF Bypass, Browser Emulation and more advanced Layer 7 techniques.
              </p>
            </div>
            <div className="bg-panel-surface rounded-xl p-6 border border-panel">
              <div className="w-12 h-12 rounded-xl bg-panel-success/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-panel-success" />
              </div>
              <h3 className="text-lg font-semibold text-panel mb-2">API Access</h3>
              <p className="text-panel-muted text-sm leading-relaxed">
                Full REST API for automated testing. Integrate stress tests into your CI/CD pipeline seamlessly.
              </p>
            </div>
            <div className="bg-panel-surface rounded-xl p-6 border border-panel">
              <div className="w-12 h-12 rounded-xl bg-panel-warning/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-panel-warning" />
              </div>
              <h3 className="text-lg font-semibold text-panel mb-2">Real-time Stats</h3>
              <p className="text-panel-muted text-sm leading-relaxed">
                Monitor attacks in real-time. View server load, CPU, RAM, and detailed attack logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-6 bg-panel-surface/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-panel mb-8">Simple, Transparent Pricing</h2>
          
          <div className="flex items-center justify-center gap-8 flex-wrap mb-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-panel">$0</p>
              <p className="text-panel-muted text-sm">Free</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-panel-primary">$19.99</p>
              <p className="text-panel-muted text-sm">Basic</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-panel-success">$49.99</p>
              <p className="text-panel-muted text-sm">Premium</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-panel-warning">$99.99</p>
              <p className="text-panel-muted text-sm">Enterprise</p>
            </div>
          </div>
          
          <Link to="/register">
            <Button className="bg-panel-primary hover:bg-panel-primary/90 text-white font-medium rounded-xl px-8">
              View All Plans <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-panel">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-panel-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-panel">Stresser.io</span>
          </div>
          <p className="text-panel-muted text-sm">
            Layer 7 Stress Testing Platform • For authorized testing only
          </p>
        </div>
      </footer>
    </div>
  );
}
