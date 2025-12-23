import { useState, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { 
  Settings, Save, RefreshCw, ArrowLeft, CreditCard, Shield, Server, Eye, EyeOff, Coins
} from "lucide-react";
import { SiBitcoin, SiLitecoin, SiEthereum, SiDogecoin, SiMonero } from "react-icons/si";
import { Link } from "react-router-dom";

const CRYPTO_OPTIONS = [
  { id: "BTC", name: "Bitcoin", icon: SiBitcoin, color: "text-orange-500" },
  { id: "LTC", name: "Litecoin", icon: SiLitecoin, color: "text-blue-400" },
  { id: "ETH", name: "Ethereum", icon: SiEthereum, color: "text-purple-400" },
  { id: "DOGE", name: "Dogecoin", icon: SiDogecoin, color: "text-yellow-500" },
  { id: "XMR", name: "Monero", icon: SiMonero, color: "text-orange-400" },
  { id: "USDT", name: "USDT (ERC20)", icon: Coins, color: "text-green-500" },
  { id: "USDT.TRC20", name: "USDT (TRC20)", icon: Coins, color: "text-green-400" },
  { id: "LTCT", name: "LTC Testnet", icon: SiLitecoin, color: "text-gray-400" },
];

export default function AdminSettings() {
  usePageTitle("Settings");
  const [settings, setSettings] = useState({
    global_max_concurrent: 500,
    maintenance_mode: false,
    coinpayments_merchant_id: "",
    coinpayments_ipn_secret: "",
    coinpayments_enabled: false,
    accepted_crypto: ["BTC", "LTC", "ETH", "USDT"]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(s => ({ ...s, ...res.data }));
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleCrypto = (cryptoId) => {
    setSettings(s => ({
      ...s,
      accepted_crypto: s.accepted_crypto?.includes(cryptoId)
        ? s.accepted_crypto.filter(c => c !== cryptoId)
        : [...(s.accepted_crypto || []), cryptoId]
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <Settings className="w-7 h-7 text-blue-500" />
                Settings
              </h1>
              <p className="text-slate-400 text-sm mt-1">Configure platform settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchSettings} variant="ghost" className="text-slate-400 hover:text-blue-500 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Global Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            Global Settings
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Max Global Concurrent Attacks</Label>
              <Input
                type="number"
                value={settings.global_max_concurrent || 500}
                onChange={(e) => setSettings(s => ({ ...s, global_max_concurrent: parseInt(e.target.value) || 500 }))}
                className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
              />
              <p className="text-xs text-slate-500">Maximum attacks running at the same time across all users</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Maintenance Mode</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.maintenance_mode || false}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, maintenance_mode: checked }))}
                />
                <span className={`text-sm ${settings.maintenance_mode ? 'text-amber-500' : 'text-slate-400'}`}>
                  {settings.maintenance_mode ? 'Enabled - Attacks Disabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500">When enabled, users cannot start new attacks</p>
            </div>
          </div>
        </motion.div>

        {/* CoinPayments Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-800"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              CoinPayments Integration
            </h2>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.coinpayments_enabled || false}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, coinpayments_enabled: checked }))}
              />
              <span className={`text-sm ${settings.coinpayments_enabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                {settings.coinpayments_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Merchant ID</Label>
                <Input
                  value={settings.coinpayments_merchant_id || ""}
                  onChange={(e) => setSettings(s => ({ ...s, coinpayments_merchant_id: e.target.value }))}
                  placeholder="Your CoinPayments Merchant ID"
                  className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">IPN Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecrets ? "text" : "password"}
                    value={settings.coinpayments_ipn_secret || ""}
                    onChange={(e) => setSettings(s => ({ ...s, coinpayments_ipn_secret: e.target.value }))}
                    placeholder="Your IPN Secret Key"
                    className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-3">Get your credentials from <a href="https://www.coinpayments.net/merchant-tools" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">CoinPayments Merchant Tools</a></p>
              <p className="text-xs text-slate-500">IPN URL (set in CoinPayments dashboard):</p>
              <code className="text-xs text-emerald-400 bg-slate-900 px-2 py-1 rounded mt-1 block font-mono">
                {window.location.origin}/api/payments/coinpayments/ipn
              </code>
            </div>
          </div>

          {/* Accepted Cryptocurrencies */}
          <div className="mt-6">
            <Label className="text-xs text-slate-400 mb-3 block">Accepted Cryptocurrencies</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CRYPTO_OPTIONS.map((crypto) => {
                const Icon = crypto.icon;
                const isSelected = settings.accepted_crypto?.includes(crypto.id);
                return (
                  <button
                    key={crypto.id}
                    type="button"
                    onClick={() => toggleCrypto(crypto.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/50 text-slate-100'
                        : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? crypto.color : 'text-slate-600'}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">{crypto.id}</p>
                      <p className="text-xs text-slate-500">{crypto.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">Security Notice</h3>
              <p className="text-xs text-slate-400">
                Keep your IPN Secret secure. Never share it publicly. The IPN endpoint verifies payment 
                notifications using HMAC-SHA512 signature validation.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
