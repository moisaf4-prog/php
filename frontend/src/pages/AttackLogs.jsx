import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { History, Target, Clock, Check, X, Square, RefreshCw, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function AttackLogs() {
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAttacks();
  }, []);

  const fetchAttacks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/attacks?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttacks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
        return <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />;
      case "completed":
        return <Check className="w-4 h-4 text-blue-500" />;
      case "stopped":
        return <Square className="w-4 h-4 text-amber-500" />;
      case "failed":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "running": return "text-emerald-500 bg-emerald-500/10";
      case "completed": return "text-blue-500 bg-blue-500/10";
      case "stopped": return "text-amber-500 bg-amber-500/10";
      case "failed": return "text-red-500 bg-red-500/10";
      default: return "text-slate-500 bg-slate-500/10";
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const filteredAttacks = statusFilter === "all" 
    ? attacks 
    : attacks.filter(a => a.status === statusFilter);

  const stats = {
    total: attacks.length,
    running: attacks.filter(a => a.status === "running").length,
    completed: attacks.filter(a => a.status === "completed").length,
    failed: attacks.filter(a => a.status === "failed" || a.status === "stopped").length
  };

  return (
    <Layout>
      <div data-testid="attack-logs" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <History className="w-7 h-7 text-blue-500" />
              Attack Logs
            </h1>
            <p className="text-slate-400 text-sm mt-1">History of your stress tests</p>
          </div>
          <Button onClick={fetchAttacks} variant="ghost" className="text-slate-400 hover:text-blue-500 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
            <p className="text-xs text-slate-500">Total Attacks</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-emerald-500">{stats.running}</p>
            <p className="text-xs text-slate-500">Running</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-blue-500">{stats.completed}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
            <p className="text-xs text-slate-500">Failed/Stopped</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-slate-100 rounded-lg">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all" className="text-slate-100">All Status</SelectItem>
              <SelectItem value="running" className="text-emerald-500">Running</SelectItem>
              <SelectItem value="completed" className="text-blue-500">Completed</SelectItem>
              <SelectItem value="stopped" className="text-amber-500">Stopped</SelectItem>
              <SelectItem value="failed" className="text-red-500">Failed</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">{filteredAttacks.length} results</span>
        </div>

        {/* Logs */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAttacks.length === 0 ? (
            <div className="bg-slate-900 rounded-xl p-12 text-center border border-slate-800">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No attacks found</p>
            </div>
          ) : (
            filteredAttacks.map((attack, idx) => (
              <motion.div
                key={attack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(attack.status)}`}>
                      {getStatusIcon(attack.status)}
                    </div>
                    <div>
                      <p className="font-mono text-slate-100">{attack.target}:{attack.port}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-blue-400 font-mono">{attack.method}</span>
                        <span className="text-xs text-slate-500">{attack.duration}s</span>
                        <span className="text-xs text-slate-500">{attack.concurrents} threads</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(attack.status)}`}>
                      {attack.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-2">{formatDate(attack.started_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}