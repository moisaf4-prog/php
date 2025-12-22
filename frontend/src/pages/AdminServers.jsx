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
import { 
  Server, Plus, Trash2, RefreshCw, Settings, Activity, Save, Wifi, WifiOff, Cpu, HardDrive, Terminal, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

export default function AdminServers() {
  const [servers, setServers] = useState([]);
  const [methods, setMethods] = useState([]);
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
      const [serversRes, settingsRes, methodsRes] = await Promise.all([
        axios.get(`${API}/admin/servers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/methods`)
      ]);
      setServers(serversRes.data);
      setSettings(settingsRes.data);
      setMethods(methodsRes.data);
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
      setNewServer({ name: "", host: "", ssh_port: 22, ssh_user: "root", ssh_key: "", ssh_password: "", max_concurrent: 100, method_commands: [] });
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
        return { ...prev, method_commands: prev.method_commands.map(mc => mc.method_id === methodId ? { ...mc, command } : mc) };
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
    if (percent < 50) return "bg-emerald-500";
    if (percent < 80) return "bg-amber-500";
    return "bg-red-500";
  };

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
      <div data-testid="admin-servers" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <Server className="w-7 h-7 text-blue-500" />
                Attack Servers
              </h1>
              <p className="text-slate-400 text-sm mt-1">Manage dedicated attack servers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={fetchData} variant="ghost" className="text-slate-400 hover:text-blue-500 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </Button>
            
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Server
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">Add Attack Server</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Configure server connection and attack commands
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-5 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Server Name</Label>
                      <Input
                        value={newServer.name}
                        onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="EU-Server-1"
                        className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Host/IP</Label>
                      <Input
                        value={newServer.host}
                        onChange={(e) => setNewServer(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="192.168.1.100"
                        className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">SSH Port</Label>
                      <Input
                        type="number"
                        value={newServer.ssh_port}
                        onChange={(e) => setNewServer(prev => ({ ...prev, ssh_port: parseInt(e.target.value) || 22 }))}
                        className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">SSH User</Label>
                      <Input
                        value={newServer.ssh_user}
                        onChange={(e) => setNewServer(prev => ({ ...prev, ssh_user: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Max Concurrent</Label>
                      <Input
                        type="number"
                        value={newServer.max_concurrent}
                        onChange={(e) => setNewServer(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 100 }))}
                        className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">SSH Password</Label>
                    <Input
                      type="password"
                      value={newServer.ssh_password}
                      onChange={(e) => setNewServer(prev => ({ ...prev, ssh_password: e.target.value }))}
                      placeholder="Leave empty for SSH key"
                      className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-500" />
                      <Label className="text-sm font-medium text-slate-100">Attack Commands</Label>
                    </div>
                    <p className="text-xs text-slate-500">
                      Define custom commands. Placeholders: {"{{target}}"}, {"{{port}}"}, {"{{duration}}"}, {"{{threads}}"}
                    </p>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {methods.map((method) => (
                        <div key={method.id} className="space-y-1">
                          <Label className="text-xs text-slate-400">{method.name}</Label>
                          <Input
                            value={getMethodCommand(method.id)}
                            onChange={(e) => updateMethodCommand(method.id, e.target.value)}
                            placeholder={`./script ${method.id.toLowerCase()} {target} {duration}`}
                            className="bg-slate-800 border-slate-700 text-slate-100 font-mono text-sm rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleAddServer} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Add Server
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" />
            Global Settings
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Max Global Concurrent</Label>
              <Input
                type="number"
                value={settings.global_max_concurrent}
                onChange={(e) => setSettings(prev => ({ ...prev, global_max_concurrent: parseInt(e.target.value) || 500 }))}
                className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked }))}
              />
              <span className="text-sm text-slate-300">Maintenance Mode</span>
              {settings.maintenance_mode && (
                <span className="text-xs text-red-500 font-medium">ACTIVE</span>
              )}
            </div>
            
            <Button onClick={handleUpdateSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {servers.length === 0 ? (
            <div className="bg-slate-900 rounded-xl p-12 text-center border border-slate-800">
              <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No servers configured</p>
              <p className="text-slate-500 text-sm">Add a server to start</p>
            </div>
          ) : (
            servers.map((server, idx) => {
              const loadPercent = getLoadPercent(server.current_load || 0, server.max_concurrent);
              const serverMethods = server.method_commands?.map(mc => mc.method_id) || [];
              
              return (
                <motion.div
                  key={server.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-slate-900 rounded-xl p-5 border ${
                    server.is_active ? "border-slate-800" : "border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        server.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                      }`} />
                      <div>
                        <h3 className="font-semibold text-slate-100">{server.name}</h3>
                        <p className="font-mono text-sm text-slate-500">{server.host}:{server.ssh_port}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button onClick={() => handlePingServer(server.id)} variant="ghost" size="sm" className="text-slate-400 hover:text-blue-500 rounded-lg">
                        {server.status === "online" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      </Button>
                      <Button onClick={() => handleToggleServer(server)} variant="ghost" size="sm" className={`rounded-lg ${server.is_active ? "text-emerald-500" : "text-slate-500"}`}>
                        <Activity className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDeleteServer(server.id)} variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className={`text-sm font-medium ${server.status === "online" ? "text-emerald-500" : "text-red-500"}`}>
                        {server.status || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">SSH User</p>
                      <p className="text-sm font-mono text-slate-300">{server.ssh_user}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Max Concurrent</p>
                      <p className="text-sm font-mono text-slate-300">{server.max_concurrent}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">CPU</p>
                        <p className="text-sm font-mono text-slate-300">{server.cpu_usage || 0}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">RAM</p>
                        <p className="text-sm font-mono text-slate-300">{server.ram_used || 0}/{server.ram_total || 0}GB</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Current Load</span>
                      <span>{server.current_load || 0} / {server.max_concurrent}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${getLoadColor(loadPercent)} transition-all`} style={{ width: `${loadPercent}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Configured Methods ({serverMethods.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {serverMethods.map((method, i) => (
                        <span key={i} className="px-2 py-1 text-xs font-mono bg-slate-800 rounded text-blue-400">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {server.method_commands?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        Commands
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {server.method_commands.map((mc, i) => (
                          <div key={i} className="text-xs font-mono bg-slate-800 p-2 rounded text-slate-400">
                            <span className="text-blue-400">{mc.method_id}:</span> {mc.command}
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