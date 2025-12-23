import { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, Key, Copy, RefreshCw, Shield, Calendar, CreditCard, Clock, Zap, ExternalLink } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Link } from "react-router-dom";

export default function Profile() {
  usePageTitle("Profile");
  const { user, refreshUser } = useAuth();
  const [regenerating, setRegenerating] = useState(false);
  const token = localStorage.getItem("token");

  const handleCopyKey = () => {
    if (user?.api_key) {
      navigator.clipboard.writeText(user.api_key);
      toast.success("API key copied!");
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Regenerate API key? Your old key will stop working.")) return;
    
    setRegenerating(true);
    try {
      await axios.post(`${API}/auth/regenerate-key`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUser();
      toast.success("API key regenerated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'basic': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'premium': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'enterprise': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <Layout>
      <div data-testid="profile-page" className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <User className="w-7 h-7 text-blue-500" />
            Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account and API access</p>
        </div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-800"
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-xl bg-blue-500/10 flex items-center justify-center text-3xl font-bold text-blue-500">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-100">{user?.username}</h2>
                {user?.role === 'admin' && (
                  <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-500 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <SiTelegram className="w-4 h-4" />
                <span>{user?.telegram_id}</span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Plan</p>
                    <p className={`font-semibold uppercase ${getPlanColor(user?.plan).split(' ')[0]}`}>{user?.plan}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expires</p>
                    <p className="text-slate-100 text-sm">{user?.plan === 'free' ? 'Never' : formatDate(user?.plan_expires)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Member Since</p>
                    <p className="text-slate-100 text-sm">{formatDate(user?.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Link to="/plans">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* API Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-800"
        >
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-500" />
            API Access
          </h3>
          
          <p className="text-slate-400 text-sm mb-4">
            Use this key to access the API programmatically. Keep it secret!
          </p>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 mb-2 block">Your API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-sm text-slate-300 overflow-x-auto">
                  {user?.api_key || "No API key"}
                </div>
                <Button onClick={handleCopyKey} variant="ghost" className="text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg">
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleRegenerate}
              disabled={regenerating}
              variant="ghost"
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              {regenerating ? (
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-2" />
              )}
              Regenerate Key
            </Button>
          </div>
        </motion.div>

        {/* API Usage Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-800"
        >
          <h3 className="text-lg font-semibold text-slate-100 mb-4">API Usage Example</h3>
          
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-slate-400">
{`curl -X POST "${API}/v1/attack" \\`}
{`  -H "X-API-Key: ${user?.api_key?.slice(0, 20) || 'YOUR_API_KEY'}..." \\`}
{`  -H "Content-Type: application/json" \\`}
{`  -d '{`}
{`    "target": "https://example.com",`}
{`    "port": 443,`}
{`    "method": "HTTP-GET",`}
{`    "duration": 60`}
{`  }'`}
            </pre>
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-1">Need Help?</h3>
              <p className="text-slate-400 text-sm">Contact our support team on Telegram</p>
            </div>
            <a href="https://t.me/layer7top" target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <SiTelegram className="w-5 h-5 mr-2" />
                @layer7top
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}