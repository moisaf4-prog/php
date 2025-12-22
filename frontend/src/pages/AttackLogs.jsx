import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { History, Target, Clock, Check, X, Square, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";

export default function AttackLogs() {
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAttacks();
  }, []);

  const fetchAttacks = async () => {
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
        return <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />;
      case "completed":
        return <Check className="w-4 h-4 text-cyber-primary" />;
      case "stopped":
        return <Square className="w-4 h-4 text-cyber-accent" />;
      case "failed":
        return <X className="w-4 h-4 text-cyber-secondary" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-cyber-muted" />;
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <Layout>
      <div data-testid="attack-logs" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-cyber-text tracking-tight flex items-center gap-3">
              <History className="w-8 h-8 text-cyber-primary" />
              ATTACK LOGS
            </h1>
            <p className="text-cyber-muted mt-1">History of your stress tests</p>
          </div>
          <Button
            onClick={fetchAttacks}
            variant="ghost"
            className="text-cyber-muted hover:text-cyber-primary"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Logs Table */}
        <div className="bg-cyber-surface border border-cyber-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : attacks.length === 0 ? (
            <div className="text-center py-20">
              <Target className="w-12 h-12 text-cyber-muted mx-auto mb-4" />
              <p className="text-cyber-muted">No attacks yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-highlight">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Status</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Target</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Method</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Duration</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Threads</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-cyber-muted">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {attacks.map((attack, idx) => (
                    <motion.tr
                      key={attack.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-cyber-border hover:bg-cyber-highlight/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attack.status)}
                          <span className={`font-code text-xs uppercase ${
                            attack.status === "running" ? "text-cyber-primary" :
                            attack.status === "completed" ? "text-cyber-primary" :
                            attack.status === "stopped" ? "text-cyber-accent" : "text-cyber-secondary"
                          }`}>
                            {attack.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-code text-cyber-text">
                        {attack.target}:{attack.port}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-cyber-highlight border border-cyber-border text-xs font-code text-cyber-accent">
                          {attack.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-code text-cyber-text">
                        {attack.duration}s
                      </td>
                      <td className="py-3 px-4 font-code text-cyber-text">
                        {attack.concurrents}
                      </td>
                      <td className="py-3 px-4 text-cyber-muted text-sm">
                        {formatDate(attack.started_at)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
