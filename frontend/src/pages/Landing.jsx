import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API, useAuth, useTheme } from "../App";
import { Button } from "../components/ui/button";
import { 
  Zap, Target, Users, Activity, Server, Clock, ArrowRight, 
  Moon, Sun, Shield, CheckCircle, TrendingUp 
} from "lucide-react";
import { SiLitecoin, SiMonero, SiTether, SiSolana } from "react-icons/si";

export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
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

  const getLoadColor = (load, max) => {
    const percent = (load / max) * 100;
    if (percent < 50) return "bg-green-500";
    if (percent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-cyber-bg">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cyber-bg/90 backdrop-blur border-b border-cyber-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyber-primary" />
            <span className="font-heading text-xl font-bold text-cyber-primary tracking-tight">STRESSER</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-cyber-muted hover:text-cyber-primary"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-cyber-primary text-black font-heading font-bold uppercase tracking-wider hover:bg-cyber-primary/90">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-cyber-muted hover:text-cyber-text">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-cyber-primary text-black font-heading font-bold uppercase tracking-wider hover:bg-cyber-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-cyber-text mb-6">
              LAYER 7 <span className="text-cyber-primary">STRESS TESTING</span>
            </h1>
            <p className="text-cyber-muted text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Professional web application stress testing platform. Test your infrastructure's resilience against HTTP floods, Slowloris, and advanced bypass techniques.
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
              <Link to="/register">
                <Button size="lg" className="bg-cyber-primary text-black font-heading font-bold uppercase tracking-wider hover:bg-cyber-primary/90 px-8">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Testing
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-cyber-border text-cyber-text hover:bg-cyber-surface">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Crypto badges */}
            <div className="flex items-center justify-center gap-6 text-cyber-muted">
              <span className="text-sm">Pay with crypto:</span>
              <SiLitecoin className="w-6 h-6" title="Litecoin" />
              <SiMonero className="w-6 h-6" title="Monero" />
              <SiTether className="w-6 h-6" title="USDT" />
              <SiSolana className="w-6 h-6" title="Solana" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 px-4 bg-cyber-surface/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-heading text-2xl font-bold text-cyber-text text-center mb-12">
              LIVE STATISTICS
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-cyber-surface border border-cyber-border p-6 text-center">
                <Users className="w-8 h-8 text-cyber-primary mx-auto mb-3" />
                <p className="font-heading text-3xl font-bold text-cyber-text">{stats?.total_users || 0}</p>
                <p className="text-cyber-muted text-sm uppercase">Total Users</p>
              </div>
              <div className="bg-cyber-surface border border-cyber-border p-6 text-center">
                <Target className="w-8 h-8 text-cyber-accent mx-auto mb-3" />
                <p className="font-heading text-3xl font-bold text-cyber-text">{stats?.total_attacks || 0}</p>
                <p className="text-cyber-muted text-sm uppercase">Total Attacks</p>
              </div>
              <div className="bg-cyber-surface border border-cyber-border p-6 text-center">
                <Activity className="w-8 h-8 text-cyber-secondary mx-auto mb-3" />
                <p className="font-heading text-3xl font-bold text-cyber-secondary">{stats?.attacks_24h || 0}</p>
                <p className="text-cyber-muted text-sm uppercase">Attacks (24h)</p>
              </div>
              <div className="bg-cyber-surface border border-cyber-border p-6 text-center">
                <Server className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p className="font-heading text-3xl font-bold text-green-500">
                  {stats?.online_servers || 0}/{stats?.total_servers || 0}
                </p>
                <p className="text-cyber-muted text-sm uppercase">Servers Online</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Server Status */}
      {stats?.servers?.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="font-heading text-2xl font-bold text-cyber-text text-center mb-8">
              SERVER STATUS
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.servers.map((server, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-cyber-surface border border-cyber-border p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${server.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      <span className="font-code text-cyber-text">{server.name}</span>
                    </div>
                    <span className={`text-xs uppercase font-bold ${server.status === "online" ? "text-green-500" : "text-red-500"}`}>
                      {server.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-cyber-muted mb-1">
                      <span>Load</span>
                      <span>{server.load}/{server.max_concurrent}</span>
                    </div>
                    <div className="h-2 bg-cyber-highlight rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getLoadColor(server.load, server.max_concurrent)} transition-all`}
                        style={{ width: `${(server.load / server.max_concurrent) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {server.methods?.slice(0, 4).map((method, i) => (
                      <span key={i} className="text-xs bg-cyber-highlight px-2 py-0.5 text-cyber-muted">
                        {method}
                      </span>
                    ))}
                    {server.methods?.length > 4 && (
                      <span className="text-xs text-cyber-muted">+{server.methods.length - 4}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {stats.servers.length === 0 && (
              <p className="text-center text-cyber-muted">No servers configured yet</p>
            )}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 px-4 bg-cyber-surface/50">
        <div className="container mx-auto">
          <h2 className="font-heading text-2xl font-bold text-cyber-text text-center mb-12">
            FEATURES
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-cyber-surface border border-cyber-border p-6">
              <Target className="w-10 h-10 text-cyber-primary mb-4" />
              <h3 className="font-heading text-lg font-bold text-cyber-text mb-2">8 Attack Methods</h3>
              <p className="text-cyber-muted text-sm">
                HTTP Flood, Slowloris, TLS Bypass, Cloudflare Bypass, Browser Emulation, and more Layer 7 techniques.
              </p>
            </div>
            <div className="bg-cyber-surface border border-cyber-border p-6">
              <Shield className="w-10 h-10 text-cyber-accent mb-4" />
              <h3 className="font-heading text-lg font-bold text-cyber-text mb-2">API Access</h3>
              <p className="text-cyber-muted text-sm">
                Full REST API for automated testing. Integrate stress tests into your CI/CD pipeline.
              </p>
            </div>
            <div className="bg-cyber-surface border border-cyber-border p-6">
              <TrendingUp className="w-10 h-10 text-cyber-secondary mb-4" />
              <h3 className="font-heading text-lg font-bold text-cyber-text mb-2">Real-time Stats</h3>
              <p className="text-cyber-muted text-sm">
                Monitor attacks in real-time. View server load, attack history, and detailed logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="font-heading text-2xl font-bold text-cyber-text mb-4">
            FLEXIBLE PRICING
          </h2>
          <p className="text-cyber-muted mb-8">
            From free tier to enterprise. Pay with crypto or card.
          </p>
          
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="font-heading text-3xl font-bold text-cyber-text">$0</p>
              <p className="text-cyber-muted text-sm">Free Tier</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl font-bold text-cyber-accent">$19.99</p>
              <p className="text-cyber-muted text-sm">Basic</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl font-bold text-cyber-primary">$49.99</p>
              <p className="text-cyber-muted text-sm">Premium</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-3xl font-bold text-cyber-secondary">$99.99</p>
              <p className="text-cyber-muted text-sm">Enterprise</p>
            </div>
          </div>
          
          <Link to="/register" className="mt-8 inline-block">
            <Button className="bg-cyber-primary text-black font-heading font-bold uppercase tracking-wider hover:bg-cyber-primary/90">
              View All Plans <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-cyber-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-cyber-primary" />
            <span className="font-heading text-cyber-primary">STRESSER</span>
          </div>
          <p className="text-cyber-muted text-sm">
            Layer 7 Stress Testing Platform • For authorized testing only
          </p>
        </div>
      </footer>
    </div>
  );
}
