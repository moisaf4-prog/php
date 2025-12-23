import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { 
  Server, Plus, Trash2, RefreshCw, Settings, Activity, Save, Wifi, WifiOff, 
  Cpu, HardDrive, Terminal, ArrowLeft, Edit2, X, Eye, EyeOff, Play, Send
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
  usePageTitle("Server Management");
  const [servers, setServers] = useState([]);
  const [methods, setMethods] = useState([]);
  const [settings, setSettings] = useState({ global_max_concurrent: 500, maintenance_mode: false });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [terminalServer, setTerminalServer] = useState(null);
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const terminalRef = useRef(null);
  const token = localStorage.getItem("token");

  const [newServer, setNewServer] = useState({
    name: "",
    host: "",
    ssh_port: 22,
    ssh_user: "root",
    ssh_password: "",
    max_concurrent: 100,
    method_commands: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

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
    if (!newServer.name || !newServer.host) {
      toast.error("Enter name and host");
      return;
    }
    try {
      await axios.post(`${API}/admin/servers`, newServer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Server added");
      setAddDialogOpen(false);
      setNewServer({ name: "", host: "", ssh_port: 22, ssh_user: "root", ssh_password: "", max_concurrent: 100, method_commands: [] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const handleUpdateServer = async () => {
    if (!editingServer) return;
    try {
      await axios.put(`${API}/admin/servers/${editingServer.id}`, editingServer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Server updated");
      setEditingServer(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
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
      toast.error("Failed to ping");
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

  const handleRunCommand = async () => {
    if (!terminalCommand.trim() || !terminalServer) return;
    
    setTerminalLoading(true);
    setTerminalOutput(prev => [...prev, { type: 'input', text: `$ ${terminalCommand}` }]);
    
    try {
      const res = await axios.post(`${API}/admin/servers/${terminalServer.id}/execute`, {
        command: terminalCommand
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTerminalOutput(prev => [...prev, { 
        type: res.data.success ? 'output' : 'error', 
        text: res.data.output || res.data.error || 'Command executed'
      }]);
    } catch (err) {
      setTerminalOutput(prev => [...prev, { 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to execute command'
      }]);
    } finally {
      setTerminalCommand("");
      setTerminalLoading(false);
    }
  };

  const openTerminal = (server) => {
    setTerminalServer(server);
    setTerminalOutput([{ type: 'system', text: `Connected to ${server.name} (${server.host})` }]);
  };

  const updateMethodCommand = (methodId, command, isEditing = false) => {
    const target = isEditing ? editingServer : newServer;
    const setTarget = isEditing ? setEditingServer : setNewServer;
    
    setTarget(prev => {
      const existing = prev.method_commands?.find(mc => mc.method_id === methodId);
      if (existing) {
        if (command === "") {
          return { ...prev, method_commands: prev.method_commands.filter(mc => mc.method_id !== methodId) };
        }
        return { ...prev, method_commands: prev.method_commands.map(mc => mc.method_id === methodId ? { ...mc, command } : mc) };
      } else if (command !== "") {
        return { ...prev, method_commands: [...(prev.method_commands || []), { method_id: methodId, command }] };
      }
      return prev;
    });
  };

  const getMethodCommand = (methodId, isEditing = false) => {
    const target = isEditing ? editingServer : newServer;
    return target?.method_commands?.find(mc => mc.method_id === methodId)?.command || "";
  };

  const getLoadPercent = (load, max) => Math.min((load / max) * 100, 100);
  const getLoadColor = (percent) => {
    if (percent < 50) return "bg-emerald-500";
    if (percent < 80) return "bg-amber-500";
    return "bg-red-500";
  };

  const toggleShowPassword = (serverId) => {
    setShowPasswords(prev => ({ ...prev, [serverId]: !prev[serverId] }));
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
        {/* Header */}
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
              <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">Add Attack Server</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Configure server connection and attack commands
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Server Name</Label>
                      <Input value={newServer.name} onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))} placeholder="EU-Server-1" className="bg-slate-800 border-slate-700 text-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Host/IP</Label>
                      <Input value={newServer.host} onChange={(e) => setNewServer(prev => ({ ...prev, host: e.target.value }))} placeholder="192.168.1.100" className="bg-slate-800 border-slate-700 text-slate-100" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">SSH Port</Label>
                      <Input type="number" value={newServer.ssh_port} onChange={(e) => setNewServer(prev => ({ ...prev, ssh_port: parseInt(e.target.value) || 22 }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">SSH User</Label>
                      <Input value={newServer.ssh_user} onChange={(e) => setNewServer(prev => ({ ...prev, ssh_user: e.target.value }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Max Concurrent</Label>
                      <Input type="number" value={newServer.max_concurrent} onChange={(e) => setNewServer(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 100 }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">SSH Password</Label>
                    <Input type="password" value={newServer.ssh_password} onChange={(e) => setNewServer(prev => ({ ...prev, ssh_password: e.target.value }))} placeholder="Enter password" className="bg-slate-800 border-slate-700 text-slate-100" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-100 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-500" />
                      Attack Commands
                    </Label>
                    <p className="text-xs text-slate-500">Use: {"{target}"}, {"{port}"}, {"{duration}"}, {"{threads}"}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {methods.map((method) => (
                        <div key={method.id} className="space-y-1">
                          <Label className="text-xs text-slate-500">{method.name}</Label>
                          <Input value={getMethodCommand(method.id)} onChange={(e) => updateMethodCommand(method.id, e.target.value)} placeholder={`./script ${method.id.toLowerCase()} {target} {duration}`} className="bg-slate-800 border-slate-700 text-slate-100 font-mono text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleAddServer} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Add Server
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Global Settings */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" />
            Global Settings
          </h3>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Max Global Concurrent</Label>
              <Input type="number" value={settings.global_max_concurrent} onChange={(e) => setSettings(prev => ({ ...prev, global_max_concurrent: parseInt(e.target.value) || 500 }))} className="bg-slate-800 border-slate-700 text-slate-100" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={settings.maintenance_mode} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked }))} />
              <span className="text-sm text-slate-300">Maintenance Mode</span>
              {settings.maintenance_mode && <span className="text-xs text-red-500 font-medium">ACTIVE</span>}
            </div>
            <Button onClick={handleUpdateSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>

        {/* Terminal Modal */}
        {terminalServer && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-100">Terminal - {terminalServer.name}</span>
                <span className="text-xs text-slate-500">({terminalServer.host})</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setTerminalServer(null)} className="h-6 w-6 text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div ref={terminalRef} className="bg-slate-950 p-4 h-64 overflow-y-auto font-mono text-sm">
              {terminalOutput.map((line, idx) => (
                <div key={idx} className={`mb-1 ${
                  line.type === 'input' ? 'text-blue-400' :
                  line.type === 'error' ? 'text-red-400' :
                  line.type === 'system' ? 'text-slate-500' :
                  'text-slate-300'
                }`}>
                  {line.text}
                </div>
              ))}
              {terminalLoading && <div className="text-slate-500 animate-pulse">Executing...</div>}
            </div>
            <div className="p-3 bg-slate-800 border-t border-slate-700">
              <form onSubmit={(e) => { e.preventDefault(); handleRunCommand(); }} className="flex gap-2">
                <Input
                  value={terminalCommand}
                  onChange={(e) => setTerminalCommand(e.target.value)}
                  placeholder="Enter command..."
                  className="bg-slate-900 border-slate-700 text-slate-100 font-mono"
                  disabled={terminalLoading}
                />
                <Button type="submit" disabled={terminalLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Servers List */}
        <div className="space-y-4">
          {servers.length === 0 ? (
            <div className="bg-slate-900 rounded-xl p-12 text-center border border-slate-800">
              <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No servers configured</p>
            </div>
          ) : (
            servers.map((server, idx) => {
              const loadPercent = getLoadPercent(server.current_load || 0, server.max_concurrent);
              const isEditing = editingServer?.id === server.id;
              
              return (
                <motion.div
                  key={server.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-slate-900 rounded-xl border ${server.is_active ? "border-slate-800" : "border-slate-800 opacity-60"}`}
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                          <Edit2 className="w-5 h-5 text-blue-500" />
                          Edit Server
                        </h3>
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateServer} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Save className="w-4 h-4 mr-2" /> Save
                          </Button>
                          <Button onClick={() => setEditingServer(null)} variant="ghost" className="text-slate-400 hover:text-slate-100">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">Server Name</Label>
                          <Input value={editingServer.name} onChange={(e) => setEditingServer(prev => ({ ...prev, name: e.target.value }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">Host/IP</Label>
                          <Input value={editingServer.host} onChange={(e) => setEditingServer(prev => ({ ...prev, host: e.target.value }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">SSH Port</Label>
                          <Input type="number" value={editingServer.ssh_port} onChange={(e) => setEditingServer(prev => ({ ...prev, ssh_port: parseInt(e.target.value) || 22 }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">SSH User</Label>
                          <Input value={editingServer.ssh_user} onChange={(e) => setEditingServer(prev => ({ ...prev, ssh_user: e.target.value }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">SSH Password</Label>
                          <div className="relative">
                            <Input 
                              type={showPasswords[server.id] ? "text" : "password"} 
                              value={editingServer.ssh_password || ""} 
                              onChange={(e) => setEditingServer(prev => ({ ...prev, ssh_password: e.target.value }))} 
                              className="bg-slate-800 border-slate-700 text-slate-100 pr-10" 
                            />
                            <button type="button" onClick={() => toggleShowPassword(server.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                              {showPasswords[server.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">Max Concurrent</Label>
                          <Input type="number" value={editingServer.max_concurrent} onChange={(e) => setEditingServer(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 100 }))} className="bg-slate-800 border-slate-700 text-slate-100" />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-100 flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-blue-500" />
                          Attack Commands
                        </Label>
                        <div className="grid md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                          {methods.map((method) => (
                            <div key={method.id} className="space-y-1">
                              <Label className="text-xs text-slate-500">{method.name}</Label>
                              <Input value={getMethodCommand(method.id, true)} onChange={(e) => updateMethodCommand(method.id, e.target.value, true)} className="bg-slate-800 border-slate-700 text-slate-100 font-mono text-xs" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${server.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                          <div>
                            <h3 className="font-semibold text-slate-100">{server.name}</h3>
                            <p className="font-mono text-sm text-slate-500">{server.host}:{server.ssh_port}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button onClick={() => openTerminal(server)} variant="ghost" size="sm" className="text-emerald-500 hover:bg-emerald-500/10 rounded-lg" title="Open Terminal">
                            <Terminal className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handlePingServer(server.id)} variant="ghost" size="sm" className="text-slate-400 hover:text-blue-500 rounded-lg" title="Ping">
                            {server.status === "online" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                          </Button>
                          <Button onClick={() => setEditingServer({ ...server })} variant="ghost" size="sm" className="text-slate-400 hover:text-blue-500 rounded-lg" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleToggleServer(server)} variant="ghost" size="sm" className={`rounded-lg ${server.is_active ? "text-emerald-500" : "text-slate-500"}`} title={server.is_active ? "Disable" : "Enable"}>
                            <Activity className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDeleteServer(server.id)} variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 rounded-lg" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Server Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                          <p className="text-xs text-slate-500">Password</p>
                          <p className="text-sm font-mono text-slate-300">{server.ssh_password ? "••••••••" : "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Max Concurrent</p>
                          <p className="text-sm font-mono text-slate-300">{server.max_concurrent}</p>
                        </div>
                      </div>
                      
                      {/* CPU Model & Stats */}
                      {server.cpu_model && (
                        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            <p className="text-sm font-medium text-slate-200">
                              {server.cpu_model} {server.cpu_cores ? `(${server.cpu_cores} Cores)` : ''}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">CPU Usage</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${server.cpu_usage > 80 ? 'bg-red-500' : server.cpu_usage > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${server.cpu_usage || 0}%` }} 
                                  />
                                </div>
                                <span className="text-sm font-mono text-slate-300">{server.cpu_usage || 0}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">RAM Usage</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${(server.ram_used / server.ram_total * 100) > 80 ? 'bg-red-500' : (server.ram_used / server.ram_total * 100) > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${server.ram_total ? (server.ram_used / server.ram_total * 100) : 0}%` }} 
                                  />
                                </div>
                                <span className="text-sm font-mono text-slate-300">{server.ram_used || 0}/{server.ram_total || 0}GB</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Fallback stats if no CPU model */}
                      {!server.cpu_model && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
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
                      )}
                      
                      {/* Load bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Current Load</span>
                          <span>{server.current_load || 0} / {server.max_concurrent}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${getLoadColor(loadPercent)} transition-all`} style={{ width: `${loadPercent}%` }} />
                        </div>
                      </div>
                      
                      {/* Methods */}
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Configured Methods ({server.method_commands?.length || 0})</p>
                        <div className="flex flex-wrap gap-2">
                          {server.method_commands?.map((mc, i) => (
                            <span key={i} className="px-2 py-1 text-xs font-mono bg-slate-800 rounded text-blue-400">
                              {mc.method_id}
                            </span>
                          ))}
                          {(!server.method_commands || server.method_commands.length === 0) && (
                            <span className="text-xs text-slate-500">No methods configured</span>
                          )}
                        </div>
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
