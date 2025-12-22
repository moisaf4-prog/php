import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { 
  Server, Plus, Trash2, RefreshCw, Settings, Activity, Edit2, Save, X, Wifi, WifiOff
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

const AVAILABLE_METHODS = [
  "HTTP-GET", "HTTP-POST", "HTTP-HEAD", "SLOWLORIS", 
  "TLS-BYPASS", "CF-BYPASS", "BROWSER-EMU", "RUDY"
];

export default function AdminServers() {
  const [servers, setServers] = useState([]);
  const [settings, setSettings] = useState({ global_max_concurrent: 500, maintenance_mode: false });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const token = localStorage.getItem("token");

  // New server form
  const [newServer, setNewServer] = useState({
    name: "",
    host: "",
    ssh_port: 22,
    ssh_user: "root",
    ssh_key: "",
    ssh_password: "",
    max_concurrent: 100,
    methods: [],
    attack_script_path: "/root/attack.py"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [serversRes, settingsRes] = await Promise.all([
        axios.get(`${API}/admin/servers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setServers(serversRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = async () => {
    if (!newServer.name || !newServer.host || newServer.methods.length === 0) {
      toast.error("Fill required fields: name, host, and at least one method");
      return;
    }

    try {
      await axios.post(`${API}/admin/servers`, newServer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Server added");
      setAddDialogOpen(false);
      setNewServer({
        name: "", host: "", ssh_port: 22, ssh_user: "root",
        ssh_key: "", ssh_password: "", max_concurrent: 100,
        methods: [], attack_script_path: "/root/attack.py"
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add server");
    }
  };

  const handleDeleteServer = async (serverId) => {
    if (!window.confirm("Delete this server?")) return;

    try {
      await axios.delete(`${API}/admin/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Server deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete server");
    }
  };

  const handlePingServer = async (serverId) => {
    try {
      const res = await axios.post(`${API}/admin/servers/${serverId}/ping`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Server is ${res.data.status}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to ping server");
    }
  };

  const handleToggleServer = async (server) => {
    try {
      await axios.put(`${API}/admin/servers/${server.id}`, 
        { is_active: !server.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(server.is_active ? "Server disabled" : "Server enabled");
      fetchData();
    } catch (err) {
      toast.error("Failed to update server");
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await axios.put(`${API}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Settings updated");
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const toggleMethod = (method) => {
    setNewServer(prev => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method]
    }));
  };

  const getLoadColor = (load, max) => {
    const percent = (load / max) * 100;
    if (percent < 50) return "bg-green-500";
    if (percent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

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
      <div data-testid="admin-servers" className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-cyber-text tracking-tight flex items-center gap-3">
              <Server className="w-8 h-8 text-cyber-primary" />
              ATTACK SERVERS
            </h1>
            <p className="text-cyber-muted mt-1">Manage dedicated attack servers</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={fetchData} variant="ghost" className="text-cyber-muted hover:text-cyber-primary">
              <RefreshCw className="w-5 h-5" />
            </Button>
            
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyber-primary text-black font-heading uppercase tracking-wider hover:bg-cyber-primary/90">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Server
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cyber-surface border-cyber-border max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading text-cyber-text">Add Attack Server</DialogTitle>
                  <DialogDescription className="text-cyber-muted">
                    Configure a new dedicated server for attacks
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-cyber-muted">Server Name *</Label>
                      <Input
                        value={newServer.name}
                        onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Server 1"
                        className="bg-cyber-highlight border-cyber-border text-cyber-text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-cyber-muted">Host/IP *</Label>
                      <Input
                        value={newServer.host}
                        onChange={(e) => setNewServer(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="192.168.1.100"
                        className="bg-cyber-highlight border-cyber-border text-cyber-text"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-cyber-muted">SSH Port</Label>
                      <Input
                        type="number"
                        value={newServer.ssh_port}
                        onChange={(e) => setNewServer(prev => ({ ...prev, ssh_port: parseInt(e.target.value) || 22 }))}
                        className="bg-cyber-highlight border-cyber-border text-cyber-text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-cyber-muted">SSH User</Label>
                      <Input
                        value={newServer.ssh_user}
                        onChange={(e) => setNewServer(prev => ({ ...prev, ssh_user: e.target.value }))}
                        className="bg-cyber-highlight border-cyber-border text-cyber-text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-cyber-muted">Max Concurrent</Label>
                      <Input
                        type="number"
                        value={newServer.max_concurrent}
                        onChange={(e) => setNewServer(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 100 }))}
                        className="bg-cyber-highlight border-cyber-border text-cyber-text"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-cyber-muted">SSH Password (or use key)</Label>
                    <Input
                      type="password"
                      value={newServer.ssh_password}
                      onChange={(e) => setNewServer(prev => ({ ...prev, ssh_password: e.target.value }))}
                      placeholder="Leave empty to use SSH key"
                      className="bg-cyber-highlight border-cyber-border text-cyber-text"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-cyber-muted">Attack Script Path</Label>
                    <Input
                      value={newServer.attack_script_path}
                      onChange={(e) => setNewServer(prev => ({ ...prev, attack_script_path: e.target.value }))}
                      className="bg-cyber-highlight border-cyber-border text-cyber-text font-code"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-cyber-muted">Supported Methods *</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_METHODS.map((method) => (
                        <button
                          key={method}
                          onClick={() => toggleMethod(method)}
                          className={`px-3 py-1 text-xs font-code border transition-colors ${
                            newServer.methods.includes(method)
                              ? "bg-cyber-primary text-black border-cyber-primary"
                              : "bg-cyber-highlight text-cyber-muted border-cyber-border hover:border-cyber-primary"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddServer}
                    className="w-full bg-cyber-primary text-black font-heading uppercase tracking-wider hover:bg-cyber-primary/90"
                  >
                    Add Server
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Global Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyber-surface border border-cyber-border p-6"
        >
          <h2 className="font-heading text-lg font-bold text-cyber-text mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyber-accent" />
            GLOBAL SETTINGS
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Global Max Concurrent</Label>
              <Input
                type="number"
                value={settings.global_max_concurrent}
                onChange={(e) => setSettings(prev => ({ ...prev, global_max_concurrent: parseInt(e.target.value) || 500 }))}
                className="bg-cyber-highlight border-cyber-border text-cyber-text"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Label className="text-xs uppercase tracking-widest text-cyber-muted">Maintenance Mode</Label>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked }))}
              />
              {settings.maintenance_mode && (
                <span className="text-xs text-cyber-secondary uppercase">Active</span>
              )}
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleUpdateSettings} className="bg-cyber-accent text-black font-heading uppercase tracking-wider">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Servers List */}
        <div className="space-y-4">
          {servers.length === 0 ? (
            <div className="bg-cyber-surface border border-cyber-border p-12 text-center">
              <Server className="w-12 h-12 text-cyber-muted mx-auto mb-4" />
              <p className="text-cyber-muted">No servers configured yet</p>
              <p className="text-cyber-muted text-sm">Add a server to start accepting attacks</p>
            </div>
          ) : (
            servers.map((server, idx) => (
              <motion.div
                key={server.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-cyber-surface border p-6 ${
                  server.is_active ? "border-cyber-border" : "border-cyber-border opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      server.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`} />
                    <div>
                      <h3 className="font-heading text-lg font-bold text-cyber-text">{server.name}</h3>
                      <p className="font-code text-sm text-cyber-muted">{server.host}:{server.ssh_port}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePingServer(server.id)}
                      variant="ghost"
                      size="sm"
                      className="text-cyber-muted hover:text-cyber-accent"
                    >
                      {server.status === "online" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => handleToggleServer(server)}
                      variant="ghost"
                      size="sm"
                      className={server.is_active ? "text-cyber-primary" : "text-cyber-muted"}
                    >
                      <Activity className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteServer(server.id)}
                      variant="ghost"
                      size="sm"
                      className="text-cyber-muted hover:text-cyber-secondary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-cyber-muted uppercase">Status</p>
                    <p className={`font-code text-sm ${server.status === "online" ? "text-green-500" : "text-red-500"}`}>
                      {server.status || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-cyber-muted uppercase">SSH User</p>
                    <p className="font-code text-sm text-cyber-text">{server.ssh_user}</p>
                  </div>
                  <div>
                    <p className="text-xs text-cyber-muted uppercase">Max Concurrent</p>
                    <p className="font-code text-sm text-cyber-text">{server.max_concurrent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-cyber-muted uppercase">Active</p>
                    <p className={`font-code text-sm ${server.is_active ? "text-cyber-primary" : "text-cyber-muted"}`}>
                      {server.is_active ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                
                {/* Load bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-cyber-muted mb-1">
                    <span>Current Load</span>
                    <span>{server.current_load || 0} / {server.max_concurrent}</span>
                  </div>
                  <div className="h-2 bg-cyber-highlight rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getLoadColor(server.current_load || 0, server.max_concurrent)} transition-all`}
                      style={{ width: `${((server.current_load || 0) / server.max_concurrent) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Methods */}
                <div className="mt-4">
                  <p className="text-xs text-cyber-muted uppercase mb-2">Supported Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {server.methods?.map((method, i) => (
                      <span key={i} className="px-2 py-1 text-xs font-code bg-cyber-highlight border border-cyber-border text-cyber-accent">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Script Path */}
                <div className="mt-4">
                  <p className="text-xs text-cyber-muted uppercase">Attack Script</p>
                  <p className="font-code text-sm text-cyber-muted">{server.attack_script_path}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
