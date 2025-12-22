import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, Key, Copy, RefreshCw, Shield, Calendar, SiTelegram } from "lucide-react";

export default function Profile() {
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
    return new Date(iso).toLocaleDateString();
  };

  return (
    <Layout>
      <div data-testid="profile-page" className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-cyber-text tracking-tight flex items-center gap-3">
            <User className="w-8 h-8 text-cyber-primary" />
            PROFILE
          </h1>
          <p className="text-cyber-muted mt-1">Manage your account and API access</p>
        </div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyber-surface border border-cyber-border p-6 relative"
        >
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-primary" />
          
          <h2 className="font-heading text-lg font-bold text-cyber-text mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-primary" />
            ACCOUNT DETAILS
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Username</Label>
              <div className="bg-cyber-highlight border border-cyber-border p-3 font-code text-cyber-text">
                {user?.username}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Telegram ID</Label>
              <div className="bg-cyber-highlight border border-cyber-border p-3 font-code text-cyber-text">
                {user?.telegram_id}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Current Plan</Label>
              <div className="bg-cyber-highlight border border-cyber-border p-3 font-code text-cyber-primary uppercase">
                {user?.plan}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Plan Expires</Label>
              <div className="bg-cyber-highlight border border-cyber-border p-3 font-code text-cyber-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyber-muted" />
                {user?.plan === "free" ? "Never (Free Plan)" : formatDate(user?.plan_expires)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* API Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-cyber-surface border border-cyber-border p-6 relative"
        >
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-accent" />
          
          <h2 className="font-heading text-lg font-bold text-cyber-text mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-cyber-accent" />
            API ACCESS
          </h2>
          
          <p className="text-cyber-muted text-sm mb-4">
            Use this key to access the API programmatically. Requires Premium or Enterprise plan.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Your API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-cyber-highlight border border-cyber-border p-3 font-code text-cyber-text text-sm overflow-x-auto">
                  {user?.api_key || "No API key"}
                </div>
                <Button
                  data-testid="copy-api-key"
                  onClick={handleCopyKey}
                  variant="ghost"
                  className="text-cyber-muted hover:text-cyber-primary hover:bg-cyber-primary/10"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <Button
              data-testid="regenerate-api-key"
              onClick={handleRegenerate}
              disabled={regenerating}
              variant="ghost"
              className="text-cyber-secondary hover:text-cyber-secondary hover:bg-cyber-secondary/10"
            >
              {regenerating ? (
                <div className="w-5 h-5 border-2 border-cyber-secondary border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-2" />
              )}
              Regenerate Key
            </Button>
          </div>
        </motion.div>

        {/* API Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-cyber-surface border border-cyber-border p-6"
        >
          <h2 className="font-heading text-lg font-bold text-cyber-text mb-4">API USAGE</h2>
          
          <div className="bg-cyber-highlight p-4 border border-cyber-border font-code text-sm overflow-x-auto">
            <pre className="text-cyber-muted">
{`# Start attack via API
curl -X POST "${API}/v1/attack" \
  -H "X-API-Key: ${user?.api_key || 'YOUR_API_KEY'}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://example.com",
    "port": 443,
    "method": "HTTP-GET",
    "duration": 60,
    "concurrents": 1
  }'`}
            </pre>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
